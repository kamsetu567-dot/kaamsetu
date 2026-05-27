import { connectDB } from "@/lib/db/mongoose";
import RateLimit from "@/lib/models/RateLimit";

// Mongo-backed rate limiter — survives Vercel cold starts and works across
// concurrent lambda instances. Each hit creates a doc with an expiresAt;
// a TTL index auto-purges expired rows.
//
// Usage: const limiter = createRateLimit(maxRequests, windowMs)
//        const { allowed, retryAfter } = await limiter(key)
export function createRateLimit(maxRequests, windowMs) {
  return async function check(key) {
    try {
      await connectDB();
      const now = new Date();

      const count = await RateLimit.countDocuments({
        key,
        expiresAt: { $gt: now },
      });

      if (count >= maxRequests) {
        const oldest = await RateLimit.findOne({ key, expiresAt: { $gt: now } })
          .sort({ expiresAt: 1 })
          .lean();
        const retryAfter = oldest
          ? Math.max(1, Math.ceil((oldest.expiresAt.getTime() - now.getTime()) / 1000))
          : Math.ceil(windowMs / 1000);
        return { allowed: false, retryAfter };
      }

      await RateLimit.create({
        key,
        expiresAt: new Date(now.getTime() + windowMs),
      });

      return { allowed: true };
    } catch (err) {
      // Fail-open: if the limiter itself errors, don't block legitimate users.
      // Worst case: brief unbounded window during a Mongo hiccup.
      console.error("Rate limiter error:", err.message);
      return { allowed: true };
    }
  };
}
