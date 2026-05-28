import { connectDB } from "@/lib/db/mongoose";
import OTP from "@/lib/models/OTP";
import { signToken } from "@/lib/utils/jwt";
import { ok, error } from "@/lib/utils/apiResponse";
import { createRateLimit } from "@/lib/middleware/rateLimit";
import { logger } from "@/lib/utils/logger";

const limiter = createRateLimit(5, 15 * 60 * 1000); // 5 / 15 min per mobile

export async function POST(request) {
  try {
    const { mobile, otp } = await request.json();
    if (!mobile || !otp) return error("mobile and otp are required");

    const { allowed, retryAfter } = await limiter(`forgot-verify:${mobile}`);
    if (!allowed) {
      return error(`Too many attempts. Try again in ${retryAfter}s`, 429);
    }

    await connectDB();

    const record = await OTP.findOne({ mobile, purpose: "reset" }).sort({ createdAt: -1 });
    if (!record || record.verified) {
      return error("Reset code expired or already used / कोड expire हो गया", 400);
    }
    if (new Date() > record.expiresAt) {
      return error("Reset code expired / कोड expire हो गया", 400);
    }
    if (record.attempts >= 5) {
      return error("Too many wrong attempts. Please request a new code.", 429);
    }

    if (record.otp !== otp) {
      record.attempts += 1;
      await record.save();
      return error("Invalid code / गलत कोड", 400);
    }

    record.verified = true;
    await record.save();

    // Single-use reset proof token, bound to this OTP doc and scoped to "reset".
    const token = signToken({ mobile, otpId: record._id.toString(), purpose: "reset" }, "10m");
    return ok({ token, mobile });
  } catch (err) {
    logger.error("forgot-password verify error", { err: err.message });
    return error("Server error", 500);
  }
}
