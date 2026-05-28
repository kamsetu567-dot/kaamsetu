import { timingSafeEqual } from "crypto";
import { signToken } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";
import { createRateLimit } from "@/lib/middleware/rateLimit";
import { logger } from "@/lib/utils/logger";

function safeCompare(a, b) {
  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false; // buffers of different lengths
  }
}

const limiter = createRateLimit(10, 15 * 60 * 1000); // 10 per 15 min per IP

export async function POST(request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { allowed, retryAfter } = await limiter(ip);
    if (!allowed) {
      return error(`Too many login attempts. Try again in ${retryAfter}s`, 429);
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return error("Username and password required");
    }

    const validUsername = process.env.ADMIN_USERNAME;
    const validPassword = process.env.ADMIN_SECRET_PASSWORD;

    if (!validUsername || !validPassword) {
      logger.error("Admin credentials not configured");
      return error("Admin login not configured. Contact server admin.", 500);
    }

    if (!safeCompare(username, validUsername) || !safeCompare(password, validPassword)) {
      return unauthorized("Invalid username or password");
    }

    const token = signToken({ id: "admin", username, role: "admin" }, "8h");

    return ok({ token, admin: { username, role: "admin" } });
  } catch (err) {
    logger.error("Admin login error", { err: err.message });
    return error("Server error", 500);
  }
}
