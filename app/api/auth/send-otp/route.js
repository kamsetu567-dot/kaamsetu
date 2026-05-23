import { connectDB } from "@/lib/db/mongoose";
import OTP from "@/lib/models/OTP";
import { ok, error } from "@/lib/utils/apiResponse";
import { createRateLimit } from "@/lib/middleware/rateLimit";
import { logger } from "@/lib/utils/logger";

const limiter = createRateLimit(3, 60 * 60 * 1000); // 3 per hour per mobile

export async function POST(request) {
  try {
    const { mobile } = await request.json();

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return error("Valid 10-digit mobile number is required");
    }

    const { allowed, retryAfter } = limiter(mobile);
    if (!allowed) {
      return error(`Too many OTP requests. Try again in ${retryAfter}s`, 429);
    }

    await connectDB();

    await OTP.deleteMany({ mobile });

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await OTP.create({ mobile, otp, expiresAt });

    // Send OTP via Fast2SMS
    const smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&route=otp&variables_values=${otp}&flash=0&numbers=${mobile}`;

    const smsResponse = await fetch(smsUrl, {
      method: "GET",
      headers: { "cache-control": "no-cache" },
    });

    const smsData = await smsResponse.json();

    if (!smsData.return) {
      logger.error("Fast2SMS OTP send failed", { mobile, smsData });
      await OTP.deleteMany({ mobile });
      return error("OTP भेजने में समस्या हुई। कृपया दोबारा try करें।", 500);
    }

    logger.info("OTP sent successfully via Fast2SMS", { mobile });
    return ok({ message: "OTP sent successfully" });
  } catch (err) {
    logger.error("send-otp error", { err: err.message });
    return error("Server error", 500);
  }
}
