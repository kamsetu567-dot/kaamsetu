import { connectDB } from "@/lib/db/mongoose";
import Report from "@/lib/models/Report";
import Worker from "@/lib/models/Worker";
import User from "@/lib/models/User";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized, notFound } from "@/lib/utils/apiResponse";
import { sendWorkerBlockedEmail } from "@/lib/utils/email";
import { logger } from "@/lib/utils/logger";

export async function PATCH(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") return unauthorized();

    const { id } = await params;
    const { action, adminNote } = await request.json();
    await connectDB();

    const report = await Report.findById(id);
    if (!report) return notFound("Report not found");

    switch (action) {
      case "mark_reviewed":
        report.status = "reviewed";
        break;

      case "block_worker": {
        const worker = await Worker.findById(report.reportedWorkerId);
        if (worker) {
          await Worker.findByIdAndUpdate(worker._id, { status: "blocked" });
          if (worker.user) {
            await User.findByIdAndUpdate(worker.user, { status: "blocked" });
            // Notify worker — fire-and-forget so a mail outage can't block the action
            const userDoc = await User.findById(worker.user).select("email name").lean();
            if (userDoc?.email) {
              sendWorkerBlockedEmail(userDoc.email, userDoc.name || worker.name, report.reason, "block_worker")
                .catch(err => logger.error("worker block email failed", { err: err.message }));
            }
          }
        }
        report.status = "action_taken";
        break;
      }

      case "warn":
        report.status = "action_taken";
        break;

      case "delete_worker": {
        if (report.reportedWorkerId) {
          const w = await Worker.findById(report.reportedWorkerId);
          if (w?.user) {
            const userDoc = await User.findById(w.user).select("email name").lean();
            if (userDoc?.email) {
              sendWorkerBlockedEmail(userDoc.email, userDoc.name || w.name, report.reason, "delete_worker")
                .catch(err => logger.error("worker delete email failed", { err: err.message }));
            }
            await User.findByIdAndDelete(w.user);
          }
          if (w) await Worker.findByIdAndDelete(w._id);
        }
        report.status = "action_taken";
        break;
      }

      default:
        return error("Invalid action");
    }

    if (adminNote) report.adminNote = adminNote;
    await report.save();
    return ok({ message: "Report updated", report: { ...report.toObject(), id: report._id } });
  } catch (err) {
    logger.error("PATCH /api/admin/reports/[id] error", { err: err.message });
    return error("Server error", 500);
  }
}
