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

    const body = await request.json();
    await connectDB();

    // ── General complaint path (used by the navbar Report button) ──
    // No workerId — accept a free-form title + description and stash it
    // with source="general" so admin can filter for these separately.
    if (!body.workerId) {
      const title = String(body.title || "").trim().slice(0, 200);
      const description = String(body.description || "").trim().slice(0, 2000);
      if (!title) return error("Title is required");
      if (description.length < 5) return error("Please describe the issue");

      const report = await Report.create({
        reportedBy: payload.id,
        reportedByRole: payload.role || (Array.isArray(payload.roles) ? payload.roles[0] : ""),
        source: "general",
        title,
        reason: "general",
        description,
      });
      return created({ message: "Report submitted", reportId: report._id });
    }

    // ── Worker-specific path (used by /workers/[id] Flag modal) ──
    const { workerId, reason, description } = body;
    if (!reason) return error("reason is required");
    if (!VALID_REASONS.includes(reason)) return error("Invalid reason");

    const worker = await Worker.findById(workerId).lean();
    if (!worker) return error("Worker not found", 404);

    const existing = await Report.findOne({ reportedWorkerId: workerId, reportedBy: payload.id }).lean();
    if (existing) return error("You have already reported this worker", 409);

    const report = await Report.create({
      reportedWorkerId: workerId,
      reportedWorkerName: worker.name,
      reportedBy: payload.id,
      reportedByRole: payload.role,
      source: "worker_profile",
      reason,
      description: description?.slice(0, 500) || "",
    });

    return created({ message: "Report submitted", reportId: report._id });
  } catch (err) {
    console.error("POST /api/reports error:", err);
    return error("Server error", 500);
  }
}
