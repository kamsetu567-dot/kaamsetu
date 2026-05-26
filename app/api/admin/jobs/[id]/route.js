import { connectDB } from "@/lib/db/mongoose";
import JobRequest from "@/lib/models/JobRequest";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized, notFound } from "@/lib/utils/apiResponse";

export async function GET(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") return unauthorized();

    const { id } = await params;
    await connectDB();

    const job = await JobRequest.findById(id).lean();
    if (!job) return notFound("Job not found");

    return ok({ job });
  } catch (err) {
    console.error("admin GET job error:", err);
    return error("Server error", 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") return unauthorized();

    const { id } = await params;
    if (!id || id === "null" || id === "undefined") return error("Invalid job ID", 400);

    const body = await request.json();
    const { status, adminNotes } = body;

    const validStatuses = ["pending", "accepted", "in_progress", "completed", "cancelled", "rejected"];
    if (status && !validStatuses.includes(status)) {
      return error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400);
    }

    await connectDB();

    const job = await JobRequest.findById(id);
    if (!job) return notFound("Job not found");

    if (status) job.status = status;
    if (adminNotes) job.adminNotes = adminNotes;
    if (status === "completed") job.resolvedAt = new Date();

    await job.save();

    return ok({ message: `Job ${status || "updated"}`, job: { id: job._id, status: job.status } });
  } catch (err) {
    console.error("admin PATCH job error:", err);
    return error("Server error", 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") return unauthorized();

    const { id } = await params;
    await connectDB();

    await JobRequest.findByIdAndDelete(id);
    return ok({ message: "Job deleted" });
  } catch (err) {
    console.error("admin DELETE job error:", err);
    return error("Server error", 500);
  }
}
