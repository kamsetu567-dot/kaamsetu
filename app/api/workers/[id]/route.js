import { connectDB } from "@/lib/db/mongoose";
import Worker from "@/lib/models/Worker";
import { ok, notFound, error } from "@/lib/utils/apiResponse";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();

    const worker = await Worker.findById(id).select("-__v").lean();
    if (!worker) return notFound("Worker not found");

    return ok({ worker: { ...worker, id: worker._id } });
  } catch (err) {
    console.error("GET /api/workers/[id] error:", err);
    return error("Server error", 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    await connectDB();

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
