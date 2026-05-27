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

    const job = await JobRequest.findById(id).lean();
    if (!job) return notFound("Job not found");
    if (job.status !== "completed") return error("Can only rate completed jobs");
    if (!job.worker) return error("No worker assigned to this job");

    // Verify this client owns the job
    const client = await Client.findOne({ user: payload.id }).lean();
    const isOwner =
      (client && String(job.clientId) === String(client._id)) ||
      job.clientMobile === payload.mobile;
    if (!isOwner) return forbidden("Not your job");

    // Atomically claim the rating slot — second concurrent caller gets null
    // ({ field: null } in Mongo matches both missing and explicitly-null)
    const claimed = await JobRequest.findOneAndUpdate(
      { _id: id, clientRating: null },
      { $set: { clientRating: rating } },
      { new: true }
    );
    if (!claimed) return error("You have already rated this job");

    // Atomically recompute the worker's running average via aggregation
    // pipeline update — keeps concurrent ratings on different jobs for the
    // same worker from clobbering each other
    await Worker.findByIdAndUpdate(job.worker, [
      {
        $set: {
          rating: {
            $round: [
              {
                $divide: [
                  {
                    $add: [
                      { $multiply: [{ $ifNull: ["$rating", 0] }, { $ifNull: ["$totalRatings", 0] }] },
                      rating,
                    ],
                  },
                  { $add: [{ $ifNull: ["$totalRatings", 0] }, 1] },
                ],
              },
              2,
            ],
          },
          totalRatings: { $add: [{ $ifNull: ["$totalRatings", 0] }, 1] },
        },
      },
    ]);

    return ok({ message: "Rating submitted. Thank you!", rating });
  } catch (err) {
    console.error("POST /api/jobs/[id]/rate error:", err);
    return error("Server error", 500);
  }
}
