import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/models/User";
import Shop from "@/lib/models/Shop";
import { signToken, verifyToken } from "@/lib/utils/jwt";
import { ok, error, created } from "@/lib/utils/apiResponse";

export async function POST(request) {
  try {
    const body = await request.json();
    const { mobile, ownerName, shopName, city, area, category, description, token } = body;

    if (!mobile || !ownerName || !shopName) return error("mobile, ownerName and shopName are required");
    if (!category) return error("Category is required");
    if (!token) return error("OTP verification required before signup");

    const tokenPayload = verifyToken(token);
    if (!tokenPayload) return error("OTP verification required before signup");

    await connectDB();

    let user = await User.findOne({ mobile });
    if (user && user.role !== "shop") return error("Mobile already registered with a different role", 400);

    if (!user) {
      user = await User.create({ mobile, name: ownerName, role: "shop" });
    } else {
      user.name = ownerName;
      await user.save();
    }

    let shop = await Shop.findOne({ user: user._id });
    if (!shop) {
      shop = await Shop.create({
        user: user._id,
        mobile,
        ownerName,
        shopName,
        category,
        description: description || "",
        location: { city: city || "", address: area || "" },
      });
    }

    const authToken = signToken({ id: user._id, mobile, role: "shop" });

    return created({
      message: "Shop registered successfully.",
      token: authToken,
      user: { id: user._id, mobile, name: ownerName, role: "shop" },
    });
  } catch (err) {
    console.error("shop signup error:", err);
    return error("Server error", 500);
  }
}
