import { connectDB } from "@/lib/db/mongoose";
import Shop from "@/lib/models/Shop";
import Ad from "@/lib/models/Ad";
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
        { shopName: { $regex: search, $options: "i" } },
        { ownerName: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }

    const [shops, total] = await Promise.all([
      Shop.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Shop.countDocuments(filter),
    ]);

    // Count each shop's real active/total ads so the LIVE badge reflects an
    // actual running Ad, not just a stale shop flag.
    const now = new Date();
    const shopIds = shops.map(s => s._id);
    const ads = await Ad.find({ shop: { $in: shopIds } }).select("shop status expiresAt").lean();
    const activeByShop = {};
    const totalByShop = {};
    ads.forEach(a => {
      const k = String(a.shop);
      totalByShop[k] = (totalByShop[k] || 0) + 1;
      if (a.status === "active" && (!a.expiresAt || new Date(a.expiresAt) > now)) {
        activeByShop[k] = (activeByShop[k] || 0) + 1;
      }
    });

    const formatted = shops.map(s => {
      const k = String(s._id);
      const hasActiveAd = (activeByShop[k] || 0) > 0;
      return {
        id: s._id,
        shopName: s.shopName,
        ownerName: s.ownerName,
        mobile: s.mobile,
        category: s.category,
        location: s.location,
        status: s.status,
        adActive: hasActiveAd,          // real state, not the bare flag
        adCount: totalByShop[k] || 0,    // total ads this shop has submitted
        adExpiry: s.adExpiry,
        rating: s.rating,
        createdAt: s.createdAt,
      };
    });

    const pages = Math.ceil(total / limit);
    return ok({
      shops: formatted,
      pagination: { total, page, limit, pages, hasNext: page < pages, hasPrev: page > 1 },
    });
  } catch (err) {
    console.error("admin GET shops error:", err);
    return error("Server error", 500);
  }
}
