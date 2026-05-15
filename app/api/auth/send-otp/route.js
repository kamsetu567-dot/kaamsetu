import { connectDB } from "@/lib/db/mongoose";
import OTP from "@/lib/models/OTP";
import { ok, error } from "@/lib/utils/apiResponse";
import { createRateLimit } from "@/lib/middleware/rateLimit";
import { logger } from "@/lib/utils/logger";

const limiter = createRateLimit(3, 60 * 60 * 1000); // 3 per hour per mobile

// TODO: Before going live, integrate real MSG91 SendOTP API here
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

    const otp = "123456"; // TODO: replace with real OTP + MSG91 before going live
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await OTP.create({ mobile, otp, expiresAt });

    console.log(`TEST OTP: ${otp} for mobile ${mobile}`);

    return ok({ message: "OTP sent successfully" });
  } catch (err) {
    logger.error("send-otp error", { err: err.message });
    return error("Server error", 500);
  }
}
