import { timingSafeEqual } from "crypto";
import { connectDB } from "@/lib/db/mongoose";
import Ad from "@/lib/models/Ad";
import Shop from "@/lib/models/Shop";
import User from "@/lib/models/User";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";

function safeCompare(a, b) {
  try {
    return timingSafeEqual(Buffer.from(a || "", "utf8"), Buffer.from(b || "", "utf8"));
  } catch {
    return false;
  }
}

// Debug-only: dump every ad + the related shop + user state. Used to diagnose
// "shop submitted ad but admin sees nothing" — usually a status filter or
// orphaned reference. Auth via body-secret only (no JWT path) so it can be
// called from any terminal.
//
// Call:
//   curl -X POST https://www.kaamsetu.live/api/admin/migrate/debug-ads \
//        -H "Content-Type: application/json" \
//        -d '{"adminSecret":"<ADMIN_SECRET_PASSWORD>"}'
export async function POST(request) {
  try {
    let body = {};
    try { body = await request.json(); } catch {}
    const expectedSecret = process.env.ADMIN_SECRET_PASSWORD;
    if (!expectedSecret || !body?.adminSecret || !safeCompare(body.adminSecret, expectedSecret)) {
      return unauthorized();
    }

    await connectDB();

    // If caller passes { cleanupOrphans: true }, delete ads whose shop no
    // longer exists in the shops collection.
    let orphansDeleted = 0;
    if (body.cleanupOrphans) {
      const allShopIds = (await Shop.find({}).select("_id").lean()).map(s => String(s._id));
      const result = await Ad.deleteMany({ shop: { $nin: allShopIds } });
      orphansDeleted = result.deletedCount || 0;
    }

    // If caller passes { clearStaleAdFlags: true }, set adActive=false on any
    // shop that has adActive=true but no actual active Ad document. Fixes the
    // misleading "LIVE" badge on shops that never ran a real ad.
    let staleFlagsCleared = 0;
    if (body.clearStaleAdFlags) {
      const now2 = new Date();
      const activeAds = await Ad.find({ status: "active", expiresAt: { $gt: now2 } }).select("shop").lean();
      const shopsWithActiveAd = new Set(activeAds.map(a => String(a.shop)));
      const flaggedShops = await Shop.find({ adActive: true }).select("_id").lean();
      const toClear = flaggedShops.filter(s => !shopsWithActiveAd.has(String(s._id))).map(s => s._id);
      if (toClear.length) {
        const r = await Shop.updateMany({ _id: { $in: toClear } }, { $set: { adActive: false } });
        staleFlagsCleared = r.modifiedCount || 0;
      }
    }

    const ads = await Ad.find({}).sort({ createdAt: -1 }).lean();
    const shopIds = [...new Set(ads.map(a => String(a.shop)))];
    const shops = await Shop.find({ _id: { $in: shopIds } }).lean();
    const userIds = [...new Set(shops.map(s => String(s.user)))];
    const users = await User.find({ _id: { $in: userIds } }).select("mobile email role status").lean();

    const shopMap = {};
    shops.forEach(s => { shopMap[String(s._id)] = s; });
    const userMap = {};
    users.forEach(u => { userMap[String(u._id)] = u; });

    return ok({
      orphansDeleted,
      staleFlagsCleared,
      totalAds: ads.length,
      adsByStatus: ads.reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      }, {}),
      ads: ads.map(a => {
        const shop = shopMap[String(a.shop)];
        const user = shop ? userMap[String(shop.user)] : null;
        return {
          id: String(a._id),
          status: a.status,
          type: a.type,
          category: a.category,
          duration: a.duration,
          budget: a.budget,
          createdAt: a.createdAt,
          hasCreative: !!a.creative,
          shopId: String(a.shop),
          shopExists: !!shop,
          shopName: shop?.shopName,
          shopStatus: shop?.status,
          userMobile: user?.mobile,
          userRole: user?.role,
        };
      }),
      // ALL shops (not just those with ads) + per-shop ad count, so we can
      // see which shops have adActive=true but zero Ad documents.
      allShops: await (async () => {
        const everyShop = await Shop.find({}).lean();
        const adCounts = {};
        const everyAd = await Ad.find({}).select("shop status").lean();
        everyAd.forEach(a => {
          const k = String(a.shop);
          adCounts[k] = (adCounts[k] || 0) + 1;
        });
        return everyShop.map(s => ({
          id: String(s._id),
          shopName: s.shopName,
          status: s.status,
          adActive: s.adActive,
          adExpiry: s.adExpiry,
          adCount: adCounts[String(s._id)] || 0,
        }));
      })(),
      totalShops: shops.length,
      shops: shops.map(s => ({
        id: String(s._id),
        shopName: s.shopName,
        status: s.status,
        userId: String(s.user),
        userExists: !!userMap[String(s.user)],
      })),
    });
  } catch (err) {
    console.error("debug-ads error:", err);
    return error("Debug failed: " + err.message, 500);
  }
}
