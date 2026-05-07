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

    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }

    const workers = await Worker.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

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
      subscriptionExpiry: w.subscriptionExpiry,
      createdAt: w.createdAt,
    }));

    return ok({ workers: formatted });
  } catch (err) {
    console.error("admin GET workers error:", err);
    return error("Server error", 500);
  }
}
