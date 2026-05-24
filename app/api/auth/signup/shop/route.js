import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/models/User";
import Shop from "@/lib/models/Shop";
import { signToken, verifyToken } from "@/lib/utils/jwt";
import { ok, error, created } from "@/lib/utils/apiResponse";
import { logger } from "@/lib/utils/logger";

export async function POST(request) {
  try {
    const body = await request.json();
    const { mobile, email, ownerName, shopName, city, area, category, description, token } = body;

    if (!mobile || !ownerName || !shopName) {
      return error("mobile, ownerName and shopName are required");
    }
    if (!token) return error("OTP verification required before signup");
    const tokenPayload = verifyToken(token);
    if (!tokenPayload) return error("OTP verification required before signup");

    await connectDB();

    const existingShop = await Shop.findOne({ mobile });
    if (existingShop) {
      if (existingShop.status === "approved" || existingShop.status === "blocked") {
        return error("Mobile number already registered", 400);
      }
      await Shop.findByIdAndUpdate(existingShop._id, {
        ownerName, shopName, category: category || "",
        description: description || "",
        location: { city: city || "", address: area || "" },
      });
      const updatedToken = signToken({ id: existingShop.user, mobile, role: "shop" });
      return ok({
        message: "Shop registration updated",
        token: updatedToken,
        user: { id: existingShop.user, mobile, name: ownerName, role: "shop" },
      });
    }

    const user = await User.create({ mobile, name: ownerName, email: email || "", role: "shop" });

    let shop;
    try {
      shop = await Shop.create({
        user: user._id,
        mobile,
        ownerName,
        shopName,
        category: category || "",
        description: description || "",
        location: { city: city || "", address: area || "" },
        status: "pending",
      });
    } catch (createError) {
      await User.findByIdAndDelete(user._id);
      logger.error("Shop create failed", { msg: createError.message });
      return error("Shop registration failed. Please try again.", 500);
    }

    const newToken = signToken({ id: user._id, mobile, role: "shop" });

    return created({
      message: "Shop registered. Pending admin approval.",
      token: newToken,
      user: { id: user._id, mobile, name: ownerName, role: "shop" },
    });
  } catch (err) {
    logger.error("[SHOP_SIGNUP] error", { msg: err.message, code: err.code });
    if (err.code === 11000) {
      return error("Mobile number already registered", 409);
    }
    return error("Server error", 500);
  }
}
