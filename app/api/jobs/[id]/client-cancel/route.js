import { connectDB } from "@/lib/db/mongoose";
import JobRequest from "@/lib/models/JobRequest";
import Client from "@/lib/models/Client";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized, forbidden, notFound } from "@/lib/utils/apiResponse";

// Client cancels a job the worker accepted but didn't show up for (or
// abandoned mid-way). Frees the worker, no totalJobs credit, no rating.
export async function POST(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload || payload.role !== "client") return unauthorized("Client access required");

    const { id } = await params;
    await connectDB();

    const job = await JobRequest.findById(id);
    if (!job) return notFound("Job not found");
    if (!["accepted", "in_progress"].includes(job.status)) {
      return error("Only an active job can be cancelled");
    }

    // Verify this client owns the job
    const client = await Client.findOne({ user: payload.id }).lean();
    const isOwner =
      (client && String(job.clientId) === String(client._id)) ||
      job.clientMobile === payload.mobile;
    if (!isOwner) return forbidden("Not your job");

    // No totalJobs, no rating — work didn't happen. workStatus is the
    // worker's notification toggle, so we don't touch it here.
    job.status = "cancelled";
    job.resolvedAt = new Date();
    job.startCode = undefined;
    await job.save();

    return ok({ message: "Job cancelled" });
  } catch (err) {
    console.error("POST /api/jobs/[id]/client-cancel error:", err);
    return error("Server error", 500);
  }
}
