import { timingSafeEqual } from "crypto";
import { connectDB } from "@/lib/db/mongoose";
import JobRequest from "@/lib/models/JobRequest";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";

function safeCompare(a, b) {
  try {
    return timingSafeEqual(Buffer.from(a || "", "utf8"), Buffer.from(b || "", "utf8"));
  } catch {
    return false;
  }
}

// One-time migration: removes malformed location.coordinates subdocs (missing coordinates array)
// that cause 2dsphere index errors on save.
//
// Auth (either):
//   - Admin JWT in Authorization header (use from same-origin DevTools).
//   - `adminSecret` in body matching ADMIN_SECRET_PASSWORD env (use from curl).
//
// Call: POST /api/admin/migrate/fix-geo
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

    // Find docs where coordinates subdoc exists but has no coordinates array
    const result = await JobRequest.updateMany(
      {
        "location.coordinates": { $exists: true },
        "location.coordinates.coordinates": { $not: { $type: "array" } },
      },
      { $unset: { "location.coordinates": "" } }
    );

    return ok({
      message: `Fixed ${result.modifiedCount} malformed job documents`,
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  } catch (err) {
    console.error("fix-geo migration error:", err);
    return error("Migration failed: " + err.message, 500);
  }
}
