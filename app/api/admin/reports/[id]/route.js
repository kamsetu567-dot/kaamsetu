import { connectDB } from "@/lib/db/mongoose";
import Report from "@/lib/models/Report";
import Worker from "@/lib/models/Worker";
import User from "@/lib/models/User";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized, notFound } from "@/lib/utils/apiResponse";

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
      case "block_worker":
        await Worker.findByIdAndUpdate(report.reportedWorkerId, { status: "blocked" });
        await User.findOneAndUpdate(
          { _id: { $in: await Worker.findById(report.reportedWorkerId).then(w => w?.user) } },
          { status: "blocked" }
        );
        report.status = "action_taken";
        break;
      case "warn":
        report.status = "action_taken";
        break;
      case "delete_worker":
        if (report.reportedWorkerId) {
          const w = await Worker.findByIdAndDelete(report.reportedWorkerId);
          if (w?.user) await User.findByIdAndDelete(w.user);
        }
        report.status = "action_taken";
        break;
      default:
        return error("Invalid action");
    }

    if (adminNote) report.adminNote = adminNote;
    await report.save();
    return ok({ message: "Report updated", report: { ...report.toObject(), id: report._id } });
  } catch (err) {
    console.error("PATCH /api/admin/reports/[id] error:", err);
    return error("Server error", 500);
  }
}
