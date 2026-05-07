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

    // Match by clientId (if we saved it) OR by mobile (for anonymous/older requests)
    const orClauses = [{ clientMobile: payload.mobile }];
    if (client) orClauses.push({ clientId: client._id });

    const requests = await JobRequest.find({ $or: orClauses })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Attach worker details for accepted/in-progress jobs
    const requestsWithWorker = await Promise.all(
      requests.map(async (req) => {
        if (req.worker) {
          const worker = await Worker.findById(req.worker)
            .select("name mobile rating experience")
            .lean();
          return { ...req, workerDetails: worker };
        }
        return req;
      })
    );

    return ok({ requests: requestsWithWorker });
  } catch (err) {
    console.error("[CLIENT_REQUESTS] error:", err);
    return error("Server error", 500);
  }
}
