import { connectDB } from "@/lib/db/mongoose";
import Client from "@/lib/models/Client";
import User from "@/lib/models/User";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") return unauthorized();

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }

    const clients = await Client.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const formatted = clients.map(c => ({
      id: c._id,
      name: c.name,
      mobile: c.mobile,
      location: c.location,
      status: c.status,
      totalRequests: c.totalRequests || 0,
      createdAt: c.createdAt,
    }));

    return ok({ clients: formatted });
  } catch (err) {
    console.error("admin clients error:", err);
    return error("Server error", 500);
  }
}
