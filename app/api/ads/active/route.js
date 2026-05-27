import { connectDB } from "@/lib/db/mongoose";
import Ad from "@/lib/models/Ad";
import Shop from "@/lib/models/Shop";
import { ok, error } from "@/lib/utils/apiResponse";

// Public endpoint — anyone can fetch currently-active ads.
// Self-healing: ads past expiresAt get flipped to "expired" inline so a
// missed cron job can't leave stale ads showing.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const type = searchParams.get("type"); // "banner" | "featured" | null
    const limit = Math.min(10, Math.max(1, parseInt(searchParams.get("limit")) || 3));

    await connectDB();
    const now = new Date();

    // Step 1: sweep any ad whose expiry has passed but is still marked active.
    // updateMany is non-blocking for the read — even if it fails the filter
    // below excludes expired ads via the $gt check.
    await Ad.updateMany(
      { status: "active", expiresAt: { $lte: now } },
      { $set: { status: "expired" } }
    ).catch(() => {});

    const filter = {
      status: "active",
      expiresAt: { $gt: now },
    };
    if (category) filter.category = category;
    if (type) filter.type = type;

    // Pull a few more than `limit` so a quick shuffle has variety
    const ads = await Ad.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 3)
      .lean();

    if (ads.length === 0) return ok({ ads: [] });

    // Enrich with shop name / mobile so the slot can render a CTA
    const shopIds = [...new Set(ads.map(a => String(a.shop)))];
    const shops = await Shop.find({ _id: { $in: shopIds } })
      .select("shopName mobile location category photo")
      .lean();
    const shopMap = {};
    shops.forEach(s => { shopMap[String(s._id)] = s; });

    // Light shuffle then trim to `limit` so the same shop doesn't always win
    const shuffled = ads
      .map(a => ({ a, k: Math.random() }))
      .sort((x, y) => x.k - y.k)
      .map(({ a }) => a)
      .slice(0, limit);

    return ok({
      ads: shuffled.map(a => ({
        id: a._id,
        type: a.type,
        category: a.category,
        creative: a.creative || null,
        shop: shopMap[String(a.shop)]
          ? {
              id: shopMap[String(a.shop)]._id,
              shopName: shopMap[String(a.shop)].shopName,
              mobile: shopMap[String(a.shop)].mobile,
              city: shopMap[String(a.shop)].location?.city,
              photo: shopMap[String(a.shop)].photo || null,
            }
          : null,
      })),
    });
  } catch (err) {
    console.error("GET /api/ads/active error:", err);
    return error("Server error", 500);
  }
}
