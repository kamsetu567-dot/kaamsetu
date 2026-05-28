import { randomInt } from "crypto";
import { connectDB } from "@/lib/db/mongoose";
import OTP from "@/lib/models/OTP";
import User from "@/lib/models/User";
import { ok, error } from "@/lib/utils/apiResponse";
import { createRateLimit } from "@/lib/middleware/rateLimit";
import { logger } from "@/lib/utils/logger";
import { sendOTPEmail } from "@/lib/utils/email";

const limiter = createRateLimit(3, 60 * 60 * 1000); // 3 / hour per mobile

// Sends a password-reset OTP to the client's *stored* email (never a user-supplied
// one) so knowing someone's mobile can't redirect their reset OTP elsewhere.
export async function POST(request) {
  try {
    const { mobile } = await request.json();

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return error("Valid 10-digit mobile number is required");
    }

    const { allowed, retryAfter } = await limiter(`forgot:${mobile}`);
    if (!allowed) {
      return error(`Too many requests. Try again in ${retryAfter}s`, 429);
    }

    await connectDB();

    const user = await User.findOne({ mobile, role: "client" }).lean();

    // Generic success regardless of whether the account exists — don't reveal which
    // mobiles are registered. Only actually send when we have a real client + email.
    const genericResponse = ok({ message: "If an account exists, a reset code has been sent to its email." });

    if (!user || !user.email) {
      return genericResponse;
    }

    await OTP.deleteMany({ mobile, purpose: "reset" });

    const otp = randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    const otpRecord = await OTP.create({ mobile, email: user.email, otp, expiresAt, purpose: "reset" });

    try {
      await sendOTPEmail(user.email, otp);
    } catch (emailErr) {
      await OTP.findByIdAndDelete(otpRecord._id);
      logger.error("Reset OTP email send failed", { err: emailErr.message, mobile });
      return error("Failed to send reset code. Please try again.", 500);
    }

    logger.info("Reset OTP sent", { mobile });
    return genericResponse;
  } catch (err) {
    logger.error("forgot-password send error", { err: err.message });
    return error("Server error", 500);
  }
}
