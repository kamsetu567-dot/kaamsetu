import { connectDB } from "@/lib/db/mongoose";
import Worker from "@/lib/models/Worker";
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
        { name: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }

    const [workers, total] = await Promise.all([
      Worker.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Worker.countDocuments(filter),
    ]);

    const formatted = workers.map(w => ({
      id: w._id,
      name: w.name,
      mobile: w.mobile,
      category: w.category,
      subcategory: w.subcategory,
      gender: w.gender,
      serviceType: w.serviceType,
      status: w.status,
      workStatus: w.workStatus,
      rating: w.rating,
      totalRatings: w.totalRatings || 0,
      subscriptionExpiry: w.subscriptionExpiry,
      createdAt: w.createdAt,
      aadharNumber: w.aadharNumber || null,
      aadharFrontUrl: w.aadharFrontUrl || null,
      aadharBackUrl: w.aadharBackUrl || null,
      photo: w.photo || null,
      city: w.location?.city || null,
    }));

    const pages = Math.ceil(total / limit);
    return ok({
      workers: formatted,
      pagination: { total, page, limit, pages, hasNext: page < pages, hasPrev: page > 1 },
    });
  } catch (err) {
    console.error("admin GET workers error:", err);
    return error("Server error", 500);
  }
}
