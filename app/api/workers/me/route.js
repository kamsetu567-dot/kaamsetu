import { connectDB } from "@/lib/db/mongoose";
import Worker from "@/lib/models/Worker";
import User from "@/lib/models/User";
import { getTokenFromRequest, verifyToken } from "@/lib/utils/jwt";
import { ok, unauthorized, forbidden, notFound, error } from "@/lib/utils/apiResponse";

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();

    const payload = verifyToken(token);
    if (!payload) return unauthorized("Invalid or expired token");

    if (payload.role !== "worker") return forbidden("Worker access required");

    await connectDB();

    const worker = await Worker.findOne({ user: payload.id }).select("-__v").lean();
    if (!worker) return notFound("Worker not found");

    const userDoc = await User.findById(worker.user).select("email").lean();

    return ok({ worker: { ...worker, id: worker._id, email: userDoc?.email || "" } });
  } catch (err) {
    console.error("GET /api/workers/me error:", err);
    return error("Server error", 500);
  }
}
