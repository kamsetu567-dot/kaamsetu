import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/models/User";
import Worker from "@/lib/models/Worker";
import Client from "@/lib/models/Client";
import JobRequest from "@/lib/models/JobRequest";
import Subscription from "@/lib/models/Subscription";
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

    const [
      totalWorkers,
      activeWorkers,
      pendingWorkers,
      totalClients,
      todayJobs,
      workingWorkers,
      freeWorkers,
      totalEarnings,
    ] = await Promise.all([
      Worker.countDocuments(),
      Worker.countDocuments({ status: "approved" }),
      Worker.countDocuments({ status: "pending" }),
      Client.countDocuments(),
      JobRequest.countDocuments({ createdAt: { $gte: today } }),
      Worker.countDocuments({ status: "approved", workStatus: "working" }),
      Worker.countDocuments({ status: "approved", workStatus: "free" }),
      Subscription.aggregate([
        { $match: { status: "active" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    return ok({
      stats: {
        totalWorkers,
        activeWorkers,
        pendingWorkers,
        totalClients,
        todayJobs,
        totalCalls: todayJobs,
        workingWorkers,
        freeWorkers,
        totalEarnings: totalEarnings[0]?.total || 0,
      },
    });
  } catch (err) {
    console.error("admin stats error:", err);
    return error("Server error", 500);
  }
}
