import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/models/User";
import { signToken } from "@/lib/utils/jwt";
import { ok, error } from "@/lib/utils/apiResponse";

// TODO: Before going live, verify OTP against MSG91 API instead of hardcoded value
export async function POST(request) {
  try {
    const { mobile, otp, mode = "login" } = await request.json();

    if (!mobile || !otp) return error("mobile and otp are required");

    // TODO: Before going live, verify OTP against MSG91 API instead of hardcoded value
    if (otp !== "123456") {
      return error("Invalid OTP / गलत OTP", 400);
    }

    await connectDB();

    const user = await User.findOne({ mobile });

    if (!user) {
      if (mode === "signup") {
        // OTP proved mobile is real; return signed token for signup flow to use
        const token = signToken({ mobile });
        return ok({ token, mobile, isNewUser: true });
      }
      return error(
        "Account not found. Please sign up first / Account नहीं मिला। पहले sign up करें",
        404
      );
    }

    if (user.isBlocked) {
      return error("आपका account block है / Your account has been blocked", 403);
    }

    user.isVerified = true;
    await user.save();

    const token = signToken({ id: user._id, mobile: user.mobile, role: user.role });

    return ok({
      token,
      mobile: user.mobile,
      user: {
        id: user._id,
        mobile: user.mobile,
        name: user.name,
        role: user.role,
        status: user.status,
      },
      isNewUser: false,
    });
  } catch (err) {
    console.error("verify-otp error:", err);
    return error("Server error", 500);
  }
}
