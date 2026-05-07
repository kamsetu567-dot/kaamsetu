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

    const { searchParams } = new URL(request.url);
    const range = parseInt(searchParams.get("range") || "7");

    await connectDB();

    const since = new Date(Date.now() - range * 24 * 60 * 60 * 1000);

    const [workersByDay, clientsByDay, jobsByDay] = await Promise.all([
      Worker.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Client.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      JobRequest.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const days = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      days.push(d.toISOString().split("T")[0]);
    }

    const toMap = arr => Object.fromEntries(arr.map(x => [x._id, x.count]));
    const wMap = toMap(workersByDay);
    const cMap = toMap(clientsByDay);
    const jMap = toMap(jobsByDay);

    const chartData = days.map(day => ({
      date: day,
      workers: wMap[day] || 0,
      clients: cMap[day] || 0,
      jobs: jMap[day] || 0,
    }));

    return ok({ chartData, range });
  } catch (err) {
    console.error("admin analytics error:", err);
    return error("Server error", 500);
  }
}
