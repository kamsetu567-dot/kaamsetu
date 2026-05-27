import { randomInt } from "crypto";
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

    const { allowed, retryAfter } = await limiter(mobile);
    if (!allowed) {
      return error(`Too many OTP requests. Try again in ${retryAfter}s`, 429);
    }

    await connectDB();

    // For login: verify the user is registered AND the submitted email is
    // the one bound to that mobile. Without this, anyone who knows a
    // victim's mobile can log in by typing their own email and receiving
    // the OTP there.
    if (mode === "login") {
      const existing = await User.findOne({ mobile }).lean();
      if (!existing) {
        return error("No account found with this number. Please sign up first.", 404);
      }
      const storedEmail = (existing.email || "").trim().toLowerCase();
      const submittedEmail = email.trim().toLowerCase();
      if (!storedEmail || storedEmail !== submittedEmail) {
        return error("Credentials mismatch / गलत जानकारी", 401);
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

    const otp = randomInt(100000, 1000000).toString(); // cryptographically secure
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    const otpRecord = await OTP.create({ mobile, email, otp, expiresAt });

    // Send email — if it fails, remove the OTP record so the rate-limit slot isn't wasted
    try {
      await sendOTPEmail(email, otp);
    } catch (emailErr) {
      await OTP.findByIdAndDelete(otpRecord._id);
      logger.error("OTP email send failed", { err: emailErr.message, mobile });
      return error("Failed to send OTP to your email. Please check the email address and try again.", 500);
    }

    logger.info("OTP sent via email", { mobile, email });
    return ok({ message: "OTP sent to your email" });
  } catch (err) {
    logger.error("send-otp error", { err: err.message });
    return error("Failed to send OTP. Please try again.", 500);
  }
}
