import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/models/User";
import Shop from "@/lib/models/Shop";
import OTP from "@/lib/models/OTP";
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
    if (!tokenPayload || !tokenPayload.otpId || tokenPayload.mobile !== mobile) {
      return error("OTP proof invalid or expired. Please verify your OTP again.");
    }

    await connectDB();

    // Atomically burn the OTP proof — single-use across all signup endpoints
    const claimedOtp = await OTP.findOneAndUpdate(
      { _id: tokenPayload.otpId, mobile, verified: true, consumed: false },
      { $set: { consumed: true } }
    );
    if (!claimedOtp) {
      return error("OTP proof already used or expired. Please verify your OTP again.");
    }

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
      const updatedToken = signToken({ id: existingShop.user, mobile, role: "shop", roles: ["shop"] });
      return ok({
        message: "Shop registration updated",
        token: updatedToken,
        user: { id: existingShop.user, mobile, name: ownerName, role: "shop", roles: ["shop"] },
      });
    }

    // Multi-role: same mobile can register as both shop and (worker|client).
    // If a User already exists for this mobile, add "shop" to their roles
    // instead of trying to insert a duplicate (which would throw on the
    // unique mobile index and 409 a legitimate signup).
    let user = await User.findOne({ mobile });
    if (user) {
      if (user.roles?.includes("shop") || user.role === "shop") {
        return error("Shop is already registered with this number", 409);
      }
      const nextRoles = Array.from(new Set([...(user.roles || []), user.role, "shop"].filter(Boolean)));
      user.roles = nextRoles;
      if (!user.name) user.name = ownerName;
      if (!user.email && email) user.email = email;
      await user.save();
    } else {
      user = await User.create({ mobile, name: ownerName, email: email || "", roles: ["shop"], role: "shop" });
    }

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
      logger.error("Shop create failed", { msg: createError.message, code: createError.code, name: createError.name });
      if (createError.name === "ValidationError") {
        const fields = Object.keys(createError.errors || {}).join(", ");
        return error(`Missing or invalid shop fields: ${fields}`, 400);
      }
      return error(`Shop registration failed: ${createError.message}`, 500);
    }

    const newToken = signToken({
      id: user._id,
      mobile,
      role: "shop",
      roles: user.roles || ["shop"],
    });

    return created({
      message: "Shop registered. Pending admin approval.",
      token: newToken,
      user: { id: user._id, mobile, name: ownerName, role: "shop", roles: user.roles || ["shop"] },
    });
  } catch (err) {
    logger.error("[SHOP_SIGNUP] error", { msg: err.message, code: err.code, name: err.name, stack: err.stack });
    if (err.code === 11000) {
      return error("Mobile number already registered", 409);
    }
    if (err.name === "ValidationError") {
      const fields = Object.keys(err.errors || {}).join(", ");
      return error(`Missing or invalid: ${fields}`, 400);
    }
    return error("Shop registration failed. Please try again.", 500);
  }
}
