import { connectDB } from "@/lib/db/mongoose";
import Worker from "@/lib/models/Worker";
import Client from "@/lib/models/Client";
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const now = new Date();
    const [
      totalWorkers, activeWorkers, pendingWorkers,
      totalClients, totalJobs, todayJobs,
      workingWorkers, freeWorkers, expiredWorkers,
    ] = await Promise.all([
      Worker.countDocuments(),
      Worker.countDocuments({ status: "approved" }),
      Worker.countDocuments({ status: "pending" }),
      Client.countDocuments(),
      JobRequest.countDocuments(),
      JobRequest.countDocuments({ createdAt: { $gte: today } }),
      Worker.countDocuments({ workStatus: "working", status: "approved" }),
      Worker.countDocuments({ workStatus: "free", status: "approved" }),
      Worker.countDocuments({ status: "approved", subscriptionExpiry: { $lt: now } }),
    ]);

    return ok({
      stats: {
        totalWorkers,
        activeWorkers,
        pendingWorkers,
        totalClients,
        totalJobs,
        todayJobs,
        workingWorkers,
        freeWorkers,
        expiredWorkers,
        totalEarnings: 0,
        totalCalls: 0,
      },
    });
  } catch (err) {
    console.error("admin stats error:", err);
    return error("Server error", 500);
  }
}
