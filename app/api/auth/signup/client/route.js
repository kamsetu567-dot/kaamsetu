import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/models/User";
import Client from "@/lib/models/Client";
import { signToken, verifyToken } from "@/lib/utils/jwt";
import { ok, error, created } from "@/lib/utils/apiResponse";

export async function POST(request) {
  try {
    const body = await request.json();
    const { mobile, name, location, otpToken } = body;

    if (!mobile || !name) return error("mobile and name are required");

    if (!otpToken) return error("OTP verification required before signup");
    const tokenPayload = verifyToken(otpToken);
    if (!tokenPayload) return error("OTP verification required before signup");

    let user = await User.findOne({ mobile });
    if (user && user.role !== "client") return error("Mobile already registered with a different role");

    if (!user) {
      user = await User.create({ mobile, name, role: "client" });
    } else {
      user.name = name;
      await user.save();
    }

    let client = await Client.findOne({ user: user._id });
    if (!client) {
      client = await Client.create({ user: user._id, mobile, name, location });
    }

    const token = signToken({ id: user._id, mobile, role: "client" });

    return created({
      message: "Client registered successfully.",
      token,
      user: { id: user._id, mobile, name, role: "client" },
    });
  } catch (err) {
    console.error("client signup error:", err);
    return error("Server error", 500);
  }
}
