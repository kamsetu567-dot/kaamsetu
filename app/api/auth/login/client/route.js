import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/models/User";
import { signToken } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";
import { createRateLimit } from "@/lib/middleware/rateLimit";
import { comparePassword } from "@/lib/utils/password";
import { logger } from "@/lib/utils/logger";

const limiter = createRateLimit(10, 15 * 60 * 1000); // 10 attempts / 15 min per mobile

export async function POST(request) {
  try {
    const { mobile, password } = await request.json();

    if (!mobile || !password) {
      return error("Mobile and password are required");
    }
    if (!/^\d{10}$/.test(mobile)) {
      return error("Enter a valid 10-digit mobile number");
    }

    const { allowed, retryAfter } = await limiter(`client-login:${mobile}`);
    if (!allowed) {
      return error(`Too many login attempts. Try again in ${retryAfter}s`, 429);
    }

    await connectDB();

    // Allow any User row that has 'client' among their roles to log in here.
    const user = await User.findOne({
      mobile,
      $or: [{ roles: "client" }, { role: "client" }],
    }).select("+password");

    // Generic message for missing user / wrong role / wrong password — don't leak which.
    if (!user) {
      return unauthorized("Invalid mobile or password");
    }

    if (!user.password) {
      // OTP-era client with no password set yet — nudge them to forgot-password.
      return error("No password set for this account. Use 'Forgot password' to set one.", 409);
    }

    const matches = await comparePassword(password, user.password);
    if (!matches) {
      return unauthorized("Invalid mobile or password");
    }

    if (user.status === "blocked") {
      return error("Your account has been blocked. Contact support.", 403);
    }

    const roles = user.roles?.length ? user.roles : [user.role].filter(Boolean);
    const token = signToken({ id: user._id, mobile: user.mobile, roles, role: "client" });

    return ok({
      token,
      user: {
        id: user._id,
        mobile: user.mobile,
        email: user.email || "",
        name: user.name,
        role: "client",
        roles,
        status: user.status,
      },
    });
  } catch (err) {
    logger.error("client password login error", { err: err.message });
    return error("Server error", 500);
  }
}
