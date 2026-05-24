import { connectDB } from "@/lib/db/mongoose";
import Worker from "@/lib/models/Worker";
import { getTokenFromRequest, verifyToken } from "@/lib/utils/jwt";
import { ok, notFound, error, unauthorized, forbidden } from "@/lib/utils/apiResponse";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();

    const worker = await Worker.findById(id)
      .select("-__v -aadharNumber -aadharFrontUrl -aadharBackUrl")
      .lean();
    if (!worker) return notFound("Worker not found");

    return ok({ worker: { ...worker, id: worker._id } });
  } catch (err) {
    console.error("GET /api/workers/[id] error:", err);
    return error("Server error", 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();

    const payload = verifyToken(token);
    if (!payload) return unauthorized("Invalid or expired token");

    const { id } = await params;
    if (!id || id === "null" || id === "undefined") {
      return error("Invalid worker ID", 400);
    }

    await connectDB();

    // Workers can only update their own profile; admins can update any
    if (payload.role === "worker") {
      const ownWorker = await Worker.findOne({ user: payload.id }).lean();
      if (!ownWorker || String(ownWorker._id) !== String(id)) {
        return forbidden("You can only update your own profile");
      }
    } else if (payload.role !== "admin") {
      return forbidden("Worker or admin access required");
    }

    const body = await request.json();
    const allowed = ["name", "photo", "bio", "experience", "serviceType", "location", "languages"];
    const updates = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const worker = await Worker.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (!worker) return notFound("Worker not found");

    return ok({ worker: { ...worker, id: worker._id } });
  } catch (err) {
    console.error("PATCH /api/workers/[id] error:", err);
    return error("Server error", 500);
  }
}
