import { connectDB } from "@/lib/db/mongoose";
import JobRequest from "@/lib/models/JobRequest";
import Worker from "@/lib/models/Worker";
import Client from "@/lib/models/Client";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized, forbidden, notFound } from "@/lib/utils/apiResponse";

export async function POST(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload || payload.role !== "client") return unauthorized("Client access required");

    const body = await request.json();
    const rating = parseInt(body.rating);
    if (!rating || rating < 1 || rating > 5) return error("Rating must be between 1 and 5");

    const { id } = await params;
    await connectDB();

    const job = await JobRequest.findById(id);
    if (!job) return notFound("Job not found");
    if (job.status !== "completed") return error("Can only rate completed jobs");
    if (job.clientRating) return error("You have already rated this job");

    // Verify this client owns the job
    const client = await Client.findOne({ user: payload.id }).lean();
    const isOwner =
      (client && String(job.clientId) === String(client._id)) ||
      job.clientMobile === payload.mobile;
    if (!isOwner) return forbidden("Not your job");

    if (!job.worker) return error("No worker assigned to this job");

    // Compute new average rating for the worker
    const worker = await Worker.findById(job.worker);
    if (!worker) return error("Worker not found");

    const prevTotal = worker.rating * worker.totalRatings;
    const newTotalRatings = worker.totalRatings + 1;
    const newRating = parseFloat(((prevTotal + rating) / newTotalRatings).toFixed(2));

    await Worker.findByIdAndUpdate(worker._id, {
      rating: newRating,
      totalRatings: newTotalRatings,
    });

    job.clientRating = rating;
    await job.save();

    return ok({ message: "Rating submitted. Thank you!", rating });
  } catch (err) {
    console.error("POST /api/jobs/[id]/rate error:", err);
    return error("Server error", 500);
  }
}
