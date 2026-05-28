import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/models/User";
import OTP from "@/lib/models/OTP";
import { signToken, verifyToken } from "@/lib/utils/jwt";
import { ok, error } from "@/lib/utils/apiResponse";
import { logger } from "@/lib/utils/logger";
import { hashPassword, validatePasswordStrength } from "@/lib/utils/password";

export async function POST(request) {
  try {
    const { mobile, token, password } = await request.json();

    if (!mobile || !token) return error("Reset verification required");

    const pwError = validatePasswordStrength(password);
    if (pwError) return error(pwError);

    const payload = verifyToken(token);
    if (!payload || payload.purpose !== "reset" || !payload.otpId || payload.mobile !== mobile) {
      return error("Reset link invalid or expired. Please start again.");
    }

    await connectDB();

    // Atomically burn the reset OTP — second use of the same token gets null.
    const claimedOtp = await OTP.findOneAndUpdate(
      { _id: payload.otpId, mobile, purpose: "reset", verified: true, consumed: false },
      { $set: { consumed: true } }
    );
    if (!claimedOtp) {
      return error("Reset code already used or expired. Please start again.");
    }

    const passwordHash = await hashPassword(password);
    const user = await User.findOneAndUpdate(
      { mobile, role: "client" },
      { $set: { password: passwordHash } },
      { new: true }
    );
    if (!user) {
      return error("Account not found.", 404);
    }

    if (user.status === "blocked") {
      return error("Your account has been blocked. Contact support.", 403);
    }

    // Log them in immediately after a successful reset.
    const authToken = signToken({ id: user._id, mobile: user.mobile, role: "client" });

    return ok({
      message: "Password updated successfully.",
      token: authToken,
      user: {
        id: user._id,
        mobile: user.mobile,
        email: user.email || "",
        name: user.name,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    logger.error("forgot-password reset error", { err: err.message });
    return error("Server error", 500);
  }
}
