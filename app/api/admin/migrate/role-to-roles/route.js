import { timingSafeEqual } from "crypto";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/models/User";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";

function safeCompare(a, b) {
  try {
    return timingSafeEqual(Buffer.from(a || "", "utf8"), Buffer.from(b || "", "utf8"));
  } catch {
    return false;
  }
}

// One-time migration: copy each user's `role` into the new `roles` array so
// existing accounts work under the new multi-role auth without losing access.
// Safe to run multiple times — only touches users where `roles` is empty.
//
// Call: POST /api/admin/migrate/role-to-roles
//   - Admin JWT in Authorization header, OR
//   - `adminSecret` in body matching ADMIN_SECRET_PASSWORD env
export async function POST(request) {
  try {
    let body = {};
    try { body = await request.json(); } catch {}

    const token = getTokenFromRequest(request);
    const payload = token ? verifyToken(token) : null;
    const headerOk = payload?.role === "admin" || payload?.roles?.includes("admin");

    const expectedSecret = process.env.ADMIN_SECRET_PASSWORD;
    const bodyOk = expectedSecret && body?.adminSecret && safeCompare(body.adminSecret, expectedSecret);

    if (!headerOk && !bodyOk) return unauthorized();

    await connectDB();

    // Only backfill users where roles is missing/empty AND role is set.
    // Mongoose 9 requires explicit updatePipeline:true when using an array as update.
    const result = await User.updateMany(
      {
        role: { $exists: true, $ne: null },
        $or: [{ roles: { $exists: false } }, { roles: { $size: 0 } }],
      },
      [{ $set: { roles: ["$role"] } }],
      { updatePipeline: true }
    );

    return ok({
      message: `Backfilled roles for ${result.modifiedCount} users`,
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  } catch (err) {
    console.error("role-to-roles migration error:", err);
    return error("Migration failed: " + err.message, 500);
  }
}
