import { connectDB } from "@/lib/db/mongoose";
import Report from "@/lib/models/Report";
import Worker from "@/lib/models/Worker";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, created, error, unauthorized } from "@/lib/utils/apiResponse";

const VALID_REASONS = ["fake_profile", "fraud", "bad_behaviour", "spam", "wrong_work"];

export async function POST(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload) return unauthorized();

    const { workerId, reason, description } = await request.json();
    if (!workerId || !reason) return error("workerId and reason are required");
    if (!VALID_REASONS.includes(reason)) return error("Invalid reason");

    await connectDB();

    const worker = await Worker.findById(workerId).lean();
    if (!worker) return error("Worker not found", 404);

    const existing = await Report.findOne({ reportedWorkerId: workerId, reportedBy: payload.id }).lean();
    if (existing) return error("You have already reported this worker", 409);

    const report = await Report.create({
      reportedWorkerId: workerId,
      reportedWorkerName: worker.name,
      reportedBy: payload.id,
      reportedByRole: payload.role,
      reason,
      description: description?.slice(0, 500) || "",
    });

    return created({ message: "Report submitted", reportId: report._id });
  } catch (err) {
    console.error("POST /api/reports error:", err);
    return error("Server error", 500);
  }
}
