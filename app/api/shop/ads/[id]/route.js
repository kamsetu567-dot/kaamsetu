import { connectDB } from "@/lib/db/mongoose";
import Ad from "@/lib/models/Ad";
import Shop from "@/lib/models/Shop";
import { getTokenFromRequest, verifyToken } from "@/lib/utils/jwt";
import { ok, error, unauthorized, forbidden, notFound } from "@/lib/utils/apiResponse";

export async function DELETE(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload || payload.role !== "shop") return unauthorized();

    const { id } = await params;
    await connectDB();

    const shop = await Shop.findOne({ user: payload.id }).lean();
    if (!shop) return error("Shop profile not found", 404);

    const ad = await Ad.findById(id);
    if (!ad) return notFound("Ad not found");
    if (String(ad.shop) !== String(shop._id)) return forbidden("Not your ad");

    await ad.deleteOne();
    return ok({ message: "Ad deleted" });
  } catch (err) {
    console.error("DELETE /api/shop/ads/[id] error:", err);
    return error("Server error", 500);
  }
}
