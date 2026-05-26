import { connectDB } from "@/lib/db/mongoose";
import Ad from "@/lib/models/Ad";
import Shop from "@/lib/models/Shop";
import { getTokenFromRequest, verifyToken } from "@/lib/utils/jwt";
import { ok, created, error, unauthorized, forbidden } from "@/lib/utils/apiResponse";

function shopGuard(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.role === "shop" ? payload : null;
}

export async function GET(request) {
  try {
    const payload = shopGuard(request);
    if (!payload) return unauthorized();

    await connectDB();
    const shop = await Shop.findOne({ user: payload.id }).lean();
    if (!shop) return error("Shop profile not found", 404);

    const ads = await Ad.find({ shop: shop._id }).sort({ createdAt: -1 }).lean();
    return ok({
      ads: ads.map(a => ({
        ...a,
        id: a._id,
        ctr: a.impressions ? ((a.clicks / a.impressions) * 100).toFixed(1) + "%" : "0%",
        expiresAt: a.expiresAt ? new Date(a.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null,
      })),
    });
  } catch (err) {
    console.error("GET /api/shop/ads error:", err);
    return error("Server error", 500);
  }
}

export async function POST(request) {
  try {
    const payload = shopGuard(request);
    if (!payload) return unauthorized();

    await connectDB();
    const shop = await Shop.findOne({ user: payload.id }).lean();
    if (!shop) return error("Shop profile not found", 404);
    if (shop.status !== "approved") return forbidden("Shop must be approved before creating ads");

    const body = await request.json();
    const { type, category, duration, budget, creative } = body;
    if (!type || !category || !duration || !budget) {
      return error("type, category, duration, budget are required", 400);
    }

    const ad = await Ad.create({
      shop: shop._id,
      shopUser: payload.id,
      type,
      category,
      duration,
      budget: Number(budget),
      creative: creative || null,
      status: "pending",
    });

    return created({ ad: { ...ad.toObject(), id: ad._id } });
  } catch (err) {
    console.error("POST /api/shop/ads error:", err);
    return error("Server error", 500);
  }
}
