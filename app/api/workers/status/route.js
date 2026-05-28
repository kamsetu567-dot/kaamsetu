import { connectDB } from "@/lib/db/mongoose";
import Worker from "@/lib/models/Worker";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";

export async function PATCH(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();

    const payload = verifyToken(token);
    if (!payload || payload.role !== "worker") return unauthorized("Worker access required");

    const { workStatus } = await request.json();
    if (!["free", "working"].includes(workStatus)) {
      return error("workStatus must be 'free' or 'working'");
    }

    await connectDB();

    const worker = await Worker.findOne({ user: payload.id }).lean();
    if (!worker) return error("Worker profile not found");

    // workStatus is purely the worker's notification toggle: "working" = stop
    // sending me new jobs, "free" = send them. It's independent of how many
    // jobs they currently hold, so there's nothing to block here.
    const updated = await Worker.findOneAndUpdate(
      { user: payload.id },
      { workStatus },
      { new: true }
    ).lean();

    return ok({ workStatus: updated.workStatus });
  } catch (err) {
    console.error("PATCH /api/workers/status error:", err);
    return error("Server error", 500);
  }
}
