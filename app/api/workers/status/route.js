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

    const worker = await Worker.findOneAndUpdate(
      { user: payload.id },
      { workStatus },
      { new: true }
    ).lean();

    if (!worker) return error("Worker profile not found");

    return ok({ workStatus: worker.workStatus });
  } catch (err) {
    console.error("PATCH /api/workers/status error:", err);
    return error("Server error", 500);
  }
}
