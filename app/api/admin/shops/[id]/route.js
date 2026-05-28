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
      // Reactivate the shop's real ad(s). Only meaningful if the shop has
      // submitted an Ad — find its most recent non-active ad and turn it on.
      const days = adDays || 30;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      const adRes = await Ad.updateMany(
        { shop: id, status: { $in: ["expired", "pending", "rejected"] } },
        { $set: { status: "active", startsAt: now, expiresAt, reviewNote: null } }
      );
      if (adRes.modifiedCount === 0) {
        // No ad to run — don't fake a LIVE state
        return error("This shop has no ad to run. The shop must submit an ad first.", 400);
      }
      shop.adActive = true;
      shop.adExpiry = expiresAt;
      await shop.save();
      return ok({ message: `Ad running for ${days} days`, adExpiry: expiresAt });
    }

    if (action === "disable_ad") {
      // Stop the shop's live ad(s) so they vanish from the public site.
      await Ad.updateMany(
        { shop: id, status: "active" },
        { $set: { status: "expired" } }
      );
      shop.adActive = false;
      await shop.save();
      return ok({ message: "Ad stopped" });
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
