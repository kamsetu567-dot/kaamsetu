import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/models/User";
import OTP from "@/lib/models/OTP";
import { signToken } from "@/lib/utils/jwt";
import { ok, error } from "@/lib/utils/apiResponse";
import { createRateLimit } from "@/lib/middleware/rateLimit";
import { logger } from "@/lib/utils/logger";

const limiter = createRateLimit(5, 15 * 60 * 1000); // 5 per 15 min per mobile

export async function POST(request) {
  try {
    const { mobile, otp, mode = "login" } = await request.json();

    if (!mobile || !otp) return error("mobile and otp are required");

    const { allowed, retryAfter } = limiter(mobile);
    if (!allowed) {
      return error(`Too many attempts. Try again in ${retryAfter}s`, 429);
    }

    await connectDB();

    const record = await OTP.findOne({ mobile }).sort({ createdAt: -1 });
    if (!record || record.verified) {
      return error("OTP expired or already used / OTP expire हो गया", 400);
    }
    if (new Date() > record.expiresAt) {
      return error("OTP expired / OTP expire हो गया", 400);
    }

    record.attempts += 1;
    if (record.attempts >= 5) {
      await record.save();
      return error("Too many attempts / बहुत अधिक प्रयास", 429);
    }

    if (record.otp !== otp) {
      await record.save();
      return error("Invalid OTP / गलत OTP", 400);
    }

    record.verified = true;
    await record.save();

    const user = await User.findOne({ mobile });

    if (!user) {
      if (mode === "signup") {
        // Short-lived proof token — only valid for 10 min (matches OTP window)
        const token = signToken({ mobile }, "10m");
        return ok({ token, mobile, isNewUser: true });
      }
      return error("Account not found. Please sign up first.", 404);
    }

    if (user.status === "blocked") {
      return error("Your account has been blocked. Contact support.", 403);
    }

    // Workers must be approved before they can log in
    if (user.role === "worker") {
      const Worker = (await import("@/lib/models/Worker")).default;
      const worker = await Worker.findOne({ user: user._id }).lean();
      if (worker && worker.status === "pending") {
        return error("Your registration is pending admin approval. You will be notified via email once approved.", 403);
      }
      if (worker && worker.status === "rejected") {
        return error("Your registration was rejected. Please contact support.", 403);
      }
    }

    const token = signToken({ id: user._id, mobile: user.mobile, role: user.role });

    return ok({
      token,
      mobile: user.mobile,
      user: {
        id: user._id,
        mobile: user.mobile,
        email: user.email || "",
        name: user.name,
        role: user.role,
        status: user.status,
      },
      isNewUser: false,
    });
  } catch (err) {
    logger.error("verify-otp error", { err: err.message });
    return error("Server error", 500);
  }
}
