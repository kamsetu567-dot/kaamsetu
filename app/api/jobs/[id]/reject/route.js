import { connectDB } from "@/lib/db/mongoose";
import JobRequest from "@/lib/models/JobRequest";
import Worker from "@/lib/models/Worker";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized, forbidden, notFound } from "@/lib/utils/apiResponse";

export async function POST(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();

    const payload = verifyToken(token);
    if (!payload || payload.role !== "worker") return unauthorized();

    const { id } = await params;
    await connectDB();

    const job = await JobRequest.findById(id);
    if (!job) return notFound("Job not found");

    const worker = await Worker.findOne({ user: payload.id }).lean();
    if (!worker) return error("Worker profile not found");

    if (job.worker) {
      // Assigned job — only the assigned worker can reject it
      if (String(job.worker) !== String(worker._id)) {
        return forbidden("You can only reject jobs assigned to you");
      }
      job.status = "rejected";
      job.worker = undefined;
      await job.save();
      await Worker.findByIdAndUpdate(worker._id, { workStatus: "free" });
      return ok({ message: "Job rejected" });
    }

    // Unassigned pending job — add worker to dismissedBy so it disappears
    // from their feed without changing status for other workers
    await JobRequest.findByIdAndUpdate(job._id, {
      $addToSet: { dismissedBy: worker._id },
    });
    return ok({ message: "Job dismissed" });
  } catch (err) {
    console.error("POST /api/jobs/[id]/reject error:", err);
    return error("Server error", 500);
  }
}
