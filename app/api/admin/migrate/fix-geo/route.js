import { connectDB } from "@/lib/db/mongoose";
import JobRequest from "@/lib/models/JobRequest";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";

// One-time migration: removes malformed location.coordinates subdocs (missing coordinates array)
// that cause 2dsphere index errors on save.
// Call: POST /api/admin/migrate/fix-geo
export async function POST(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") return unauthorized();

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
