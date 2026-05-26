import { connectDB } from "@/lib/db/mongoose";
import JobRequest from "@/lib/models/JobRequest";
import Worker from "@/lib/models/Worker";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized, notFound } from "@/lib/utils/apiResponse";

export async function POST(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();

    const payload = verifyToken(token);
    if (!payload || payload.role !== "worker") return unauthorized("Worker access required");

    const { id } = await params;
    await connectDB();

    const job = await JobRequest.findById(id);
    if (!job) return notFound("Job not found");
    if (job.status !== "pending") return error("Job is no longer pending");

    const worker = await Worker.findOne({ user: payload.id });
    if (!worker) return error("Worker profile not found");
    if (worker.status !== "approved") return error("Your account is not approved yet.", 403);
    if (!worker.subscriptionExpiry || worker.subscriptionExpiry < new Date()) {
      return error("Your subscription has expired. Please renew to accept jobs.", 403);
    }

    if (worker.workStatus === "working") {
      return error("You already have an active job. Complete it before accepting a new one.", 409);
    }

    job.worker = worker._id;
    job.status = "accepted";
    await job.save();

    await Worker.findByIdAndUpdate(worker._id, { workStatus: "working" });

    return ok({
      message: "Job accepted. The client will call you shortly.",
    });
  } catch (err) {
    console.error("POST /api/jobs/[id]/accept error:", err);
    return error("Server error", 500);
  }
}
