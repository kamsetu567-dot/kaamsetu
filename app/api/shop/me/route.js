import { connectDB } from "@/lib/db/mongoose";
import Shop from "@/lib/models/Shop";
import { getTokenFromRequest, verifyToken } from "@/lib/utils/jwt";
import { ok, error, unauthorized, notFound } from "@/lib/utils/apiResponse";

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload || payload.role !== "shop") return unauthorized();

    await connectDB();
    const shop = await Shop.findOne({ user: payload.id }).lean();
    if (!shop) return notFound("Shop profile not found");

    return ok({ shop: { ...shop, id: shop._id } });
  } catch (err) {
    console.error("GET /api/shop/me error:", err);
    return error("Server error", 500);
  }
}
