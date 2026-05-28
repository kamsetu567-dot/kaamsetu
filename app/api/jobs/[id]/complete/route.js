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
    if (!["accepted", "in_progress"].includes(job.status)) {
      return error("Job is not in an active state");
    }

    const worker = await Worker.findOne({ user: payload.id });
    if (!worker) return error("Worker profile not found");
    if (String(job.worker) !== String(worker._id)) return forbidden("Not your job");

    job.status = "completed";
    job.resolvedAt = new Date();
    job.startCode = undefined; // code no longer needed
    await job.save();

    // Increment the worker's completed-jobs count. workStatus is left alone —
    // it's the worker's own notification toggle, not a job-lifecycle flag.
    await Worker.findByIdAndUpdate(worker._id, {
      $inc: { totalJobs: 1 },
    });

    return ok({ message: "Job completed" });
  } catch (err) {
    console.error("POST /api/jobs/[id]/complete error:", err);
    return error("Server error", 500);
  }
}
