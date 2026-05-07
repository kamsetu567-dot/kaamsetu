import { connectDB } from "@/lib/db/mongoose";
import JobRequest from "@/lib/models/JobRequest";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized, notFound } from "@/lib/utils/apiResponse";

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

    job.status = "rejected";
    await job.save();

    return ok({ message: "Job rejected" });
  } catch (err) {
    console.error("POST /api/jobs/[id]/reject error:", err);
    return error("Server error", 500);
  }
}
