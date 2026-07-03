import { connectDB } from "@/lib/db/mongoose";
import Client from "@/lib/models/Client";
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
    const page = Math.max(1, parseInt(searchParams.get("page")) || 1);
    const limit = Math.min(2000, Math.max(1, parseInt(searchParams.get("limit")) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }

    const [clients, total] = await Promise.all([
      Client.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Client.countDocuments(filter),
    ]);

    const formatted = clients.map(c => ({
      id: c._id,
      name: c.name,
      mobile: c.mobile,
      location: c.location,
      status: c.status,
      totalRequests: c.totalRequests || 0,
      createdAt: c.createdAt,
    }));

    const pages = Math.ceil(total / limit);
    return ok({
      clients: formatted,
      pagination: { total, page, limit, pages, hasNext: page < pages, hasPrev: page > 1 },
    });
  } catch (err) {
    console.error("admin clients error:", err);
    return error("Server error", 500);
  }
}
