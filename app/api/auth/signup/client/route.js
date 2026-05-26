import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/models/User";
import Client from "@/lib/models/Client";
import { signToken, verifyToken } from "@/lib/utils/jwt";
import { ok, error, created } from "@/lib/utils/apiResponse";
import { logger } from "@/lib/utils/logger";

export async function POST(request) {
  try {
    const body = await request.json();
    const { mobile, name, email, city, area, location, lat, lng, otpToken, token: otpProofToken } = body;
    const verifyTokenStr = otpToken || otpProofToken;

    if (!mobile || !name) return error("mobile and name are required");

    if (!verifyTokenStr) return error("OTP verification required before signup");
    const tokenPayload = verifyToken(verifyTokenStr);
    if (!tokenPayload) return error("OTP verification required before signup");

    await connectDB();

    let user = await User.findOne({ mobile });
    if (user && user.role !== "client") return error("Mobile already registered with a different role");

    if (!user) {
      user = await User.create({ mobile, name, email: email || "", role: "client" });
    } else {
      user.name = name;
      await user.save();
    }

    const locationData = location || {
      city: city || "",
      address: area || "",
      ...(lat && lng && {
        coordinates: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
      }),
    };

    let client = await Client.findOne({ user: user._id });
    if (!client) {
      client = await Client.create({
        user: user._id,
        mobile,
        name,
        location: locationData,
      });
    } else if (lat && lng) {
      client.location = { ...client.location.toObject?.() || client.location, ...locationData };
      await client.save();
    }

    const authToken = signToken({ id: user._id, mobile, role: "client" });

    return created({
      message: "Client registered successfully.",
      token: authToken,
      user: { id: user._id, mobile, name, email: email || "", role: "client" },
    });
  } catch (err) {
    logger.error("client signup error", { err: err.message });
    return error("Server error", 500);
  }
}
