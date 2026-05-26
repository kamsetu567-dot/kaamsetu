import { connectDB } from "@/lib/db/mongoose";
import OTP from "@/lib/models/OTP";
import User from "@/lib/models/User";
import { ok, error } from "@/lib/utils/apiResponse";
import { createRateLimit } from "@/lib/middleware/rateLimit";
import { logger } from "@/lib/utils/logger";
import { sendOTPEmail } from "@/lib/utils/email";

const limiter = createRateLimit(3, 60 * 60 * 1000); // 3 per hour per mobile

export async function POST(request) {
  try {
    const { mobile, email, mode, role } = await request.json();

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return error("Valid 10-digit mobile number is required");
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return error("Valid email address is required");
    }

    const { allowed, retryAfter } = limiter(mobile);
    if (!allowed) {
      return error(`Too many OTP requests. Try again in ${retryAfter}s`, 429);
    }

    await connectDB();

    // For login: verify the user is already registered before wasting an OTP
    if (mode === "login") {
      const existing = await User.findOne({ mobile }).lean();
      if (!existing) {
        return error("No account found with this number. Please sign up first.", 404);
      }
    }

    // For signup: catch duplicate accounts BEFORE sending the OTP so the user
    // doesn't waste 4 steps only to get an error at the very end
    if (mode !== "login") {
      const existing = await User.findOne({ mobile }).lean();
      if (existing) {
        if (existing.role === "worker" && role === "worker") {
          // Pending/rejected workers may re-register — only block approved/blocked
          const WorkerModel = (await import("@/lib/models/Worker")).default;
          const w = await WorkerModel.findOne({ user: existing._id }).lean();
          if (w && (w.status === "approved" || w.status === "blocked")) {
            return error(
              w.status === "blocked"
                ? "Your account has been blocked. Please contact support."
                : "You already have a worker account with this number. Please login instead.",
              409
            );
          }
        } else {
          // Client, shop, or any other role mismatch
          return error("An account already exists with this number. Please login instead.", 409);
        }
      }
    }

    await OTP.deleteMany({ mobile });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await OTP.create({ mobile, email, otp, expiresAt });

    await sendOTPEmail(email, otp);

    logger.info("OTP sent via email", { mobile, email });
    return ok({ message: "OTP sent to your email" });
  } catch (err) {
    logger.error("send-otp error", { err: err.message });
    return error("Failed to send OTP. Please try again.", 500);
  }
}
