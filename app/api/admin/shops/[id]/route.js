import { connectDB } from "@/lib/db/mongoose";
import Shop from "@/lib/models/Shop";
import User from "@/lib/models/User";
import Ad from "@/lib/models/Ad";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized, notFound } from "@/lib/utils/apiResponse";

export async function PATCH(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") return unauthorized();

    const { id } = await params;
    const { action, adDays } = await request.json();

    await connectDB();

    const shop = await Shop.findById(id);
    if (!shop) return notFound("Shop not found");

    if (action === "approve") {
      shop.status = "approved";
      await shop.save();
      return ok({ message: "Shop approved", status: "approved" });
    }

    if (action === "reject") {
      shop.status = "rejected";
      await shop.save();
      return ok({ message: "Shop rejected", status: "rejected" });
    }

    if (action === "block") {
      shop.status = "blocked";
      await shop.save();
      await User.findByIdAndUpdate(shop.user, { status: "blocked" });
      return ok({ message: "Shop blocked", status: "blocked" });
    }

    if (action === "unblock") {
      shop.status = "approved";
      await shop.save();
      await User.findByIdAndUpdate(shop.user, { status: "active" });
      return ok({ message: "Shop unblocked", status: "approved" });
    }

    if (action === "enable_ad") {
      const days = adDays || 30;
      const now = new Date();
      const base = shop.adExpiry && shop.adExpiry > now ? shop.adExpiry : now;
      shop.adActive = true;
      shop.adExpiry = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
      await shop.save();
      return ok({ message: `Ad enabled for ${days} days`, adExpiry: shop.adExpiry });
    }

    if (action === "disable_ad") {
      shop.adActive = false;
      await shop.save();
      return ok({ message: "Ad disabled" });
    }

    if (action === "delete") {
      // Cascade: drop all the shop's ads so they don't orphan the admin Ads list
      await Ad.deleteMany({ shop: id });
      await Shop.findByIdAndDelete(id);
      await User.findByIdAndUpdate(shop.user, { role: "client" });
      return ok({ message: "Shop and its ads deleted" });
    }

    return error("Invalid action");
  } catch (err) {
    console.error("admin PATCH shop error:", err);
    return error("Server error", 500);
  }
}
