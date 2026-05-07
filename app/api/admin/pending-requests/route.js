import { connectDB } from "@/lib/db/mongoose";
import JobRequest from "@/lib/models/JobRequest";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") return unauthorized();

    await connectDB();

    const requests = await JobRequest.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return ok({
      requests: requests.map(r => ({
        id: r._id,
        clientMobile: r.clientMobile,
        clientName: r.clientName,
        category: r.category,
        subcategory: r.subcategory,
        description: r.description,
        location: r.location,
        source: r.source,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error("admin pending-requests error:", err);
    return error("Server error", 500);
  }
}

export async function PATCH(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") return unauthorized();

    const { requestId, action } = await request.json();
    if (!requestId || !["called", "resolved"].includes(action)) {
      return error("requestId and valid action required");
    }

    await connectDB();

    const update = action === "called"
      ? { calledAt: new Date() }
      : { status: "completed", resolvedAt: new Date() };

    await JobRequest.findByIdAndUpdate(requestId, update);

    return ok({ message: `Request marked as ${action}` });
  } catch (err) {
    console.error("admin pending-requests PATCH error:", err);
    return error("Server error", 500);
  }
}
