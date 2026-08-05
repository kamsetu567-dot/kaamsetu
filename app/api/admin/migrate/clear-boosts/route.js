import { timingSafeEqual } from "crypto";
import { connectDB } from "@/lib/db/mongoose";
import Worker from "@/lib/models/Worker";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";

function safeCompare(a, b) {
  try {
    return timingSafeEqual(Buffer.from(a || "", "utf8"), Buffer.from(b || "", "utf8"));
  } catch {
    return false;
  }
}

// One-time migration: clears all active worker boosts now that the Boost feature
// has been removed from the admin UI. Sets boosted=false and unsets boostedUntil
// on every boosted worker. Idempotent — safe to call twice.
//
// Auth (either):
//   - Admin JWT in Authorization header (use from same-origin admin DevTools).
//   - `adminSecret` in body matching ADMIN_SECRET_PASSWORD env (use from curl).
//
// Call:
//   curl -X POST https://karvia.services/api/admin/migrate/clear-boosts \
//        -H "Content-Type: application/json" \
//        -d '{"adminSecret":"<ADMIN_SECRET_PASSWORD>"}'
export async function POST(request) {
  try {
    let body = {};
    try { body = await request.json(); } catch {}

    const token = getTokenFromRequest(request);
    const payload = token ? verifyToken(token) : null;
    const headerOk = payload?.role === "admin";

    const expectedSecret = process.env.ADMIN_SECRET_PASSWORD;
    const bodyOk = expectedSecret && body?.adminSecret && safeCompare(body.adminSecret, expectedSecret);

    if (!headerOk && !bodyOk) return unauthorized();

    await connectDB();

    const result = await Worker.updateMany(
      { boosted: true },
      { $set: { boosted: false }, $unset: { boostedUntil: "" } }
    );

    return ok({
      message: `Cleared ${result.modifiedCount} active boost(s)`,
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  } catch (err) {
    console.error("clear-boosts migration error:", err);
    return error("Migration failed: " + err.message, 500);
  }
}
