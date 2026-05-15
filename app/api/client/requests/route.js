import { connectDB } from "@/lib/db/mongoose";
import JobRequest from "@/lib/models/JobRequest";
import Client from "@/lib/models/Client";
import Worker from "@/lib/models/Worker";
import { getTokenFromRequest, verifyToken } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();

    const payload = verifyToken(token);
    if (!payload) return unauthorized("Invalid or expired token");

    await connectDB();

    const client = await Client.findOne({ user: payload.id }).lean();

    const orClauses = [{ clientMobile: payload.mobile }];
    if (client) orClauses.push({ clientId: client._id });

    const requests = await JobRequest.find({ $or: orClauses })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Batch-fetch all referenced workers in one query to avoid N+1
    const workerIds = [...new Set(requests.map(r => r.worker).filter(Boolean).map(String))];
    const workersById = {};
    if (workerIds.length > 0) {
      const workers = await Worker.find({ _id: { $in: workerIds } })
        .select("name mobile rating experience")
        .lean();
      workers.forEach(w => { workersById[String(w._id)] = w; });
    }

    const requestsWithWorker = requests.map(req => ({
      ...req,
      workerDetails: req.worker ? (workersById[String(req.worker)] || null) : null,
    }));

    return ok({ requests: requestsWithWorker });
  } catch (err) {
    console.error("[CLIENT_REQUESTS] error:", err);
    return error("Server error", 500);
  }
}
