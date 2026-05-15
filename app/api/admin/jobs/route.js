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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit")) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (search) {
      filter.$or = [
        { category: { $regex: search, $options: "i" } },
        { clientMobile: { $regex: search, $options: "i" } },
        { clientName: { $regex: search, $options: "i" } },
      ];
    }

    const [jobs, total] = await Promise.all([
      JobRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      JobRequest.countDocuments(filter),
    ]);

    const formatted = jobs.map(j => ({
      _id: j._id,
      id: j._id,
      clientName: j.clientName,
      clientMobile: j.clientMobile,
      category: j.category,
      subcategory: j.subcategory,
      location: j.location || {},
      city: j.location?.city || j.city || "",
      area: j.location?.address || "",
      description: j.description || "",
      status: j.status,
      source: j.source,
      worker: j.worker,
      createdAt: j.createdAt,
    }));

    const pages = Math.ceil(total / limit);
    return ok({
      jobs: formatted,
      pagination: { total, page, limit, pages, hasNext: page < pages, hasPrev: page > 1 },
    });
  } catch (err) {
    console.error("admin jobs error:", err);
    return error("Server error", 500);
  }
}
