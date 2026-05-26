import { connectDB } from "@/lib/db/mongoose";
import Ad from "@/lib/models/Ad";
import Shop from "@/lib/models/Shop";
import { getTokenFromRequest, verifyToken } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";

function adminGuard(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.role === "admin" ? payload : null;
}

export async function GET(request) {
  try {
    if (!adminGuard(request)) return unauthorized();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page   = Math.max(1, parseInt(searchParams.get("page"))  || 1);
    const limit  = Math.min(50, Math.max(1, parseInt(searchParams.get("limit")) || 20));
    const skip   = (page - 1) * limit;

    await connectDB();
    const filter = status ? { status } : {};

    const [ads, total] = await Promise.all([
      Ad.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Ad.countDocuments(filter),
    ]);

    // Enrich with shop names
    const shopIds = [...new Set(ads.map(a => String(a.shop)))];
    const shops = await Shop.find({ _id: { $in: shopIds } }).select("shopName").lean();
    const shopMap = {};
    shops.forEach(s => { shopMap[String(s._id)] = s.shopName; });

    return ok({
      ads: ads.map(a => ({
        ...a,
        id: a._id,
        shopName: shopMap[String(a.shop)] || "—",
        ctr: a.impressions ? ((a.clicks / a.impressions) * 100).toFixed(1) + "%" : "0%",
      })),
      pagination: {
        total, page, limit,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/admin/ads error:", err);
    return error("Server error", 500);
  }
}
