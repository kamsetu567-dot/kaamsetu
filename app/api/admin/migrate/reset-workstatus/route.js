import { timingSafeEqual } from "crypto";
import { connectDB } from "@/lib/db/mongoose";
import Worker from "@/lib/models/Worker";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";

function safeCompare(a, b) {
  try {
    return timingSafeEqual(Buffer.from(a || "", "utf8"), Buffer.from(b || "", "utf8"));
  } catch {
    return false;
  }
}

// One-time migration: workStatus changed meaning. It used to be a
// job-lifecycle flag (set to "working" on accept). It's now purely the
// worker's notification toggle. Every worker who ever accepted a job under
// the old logic has a stale "working" value that wrongly shows them as busy
// and silences their job feed. Reset all workers to "free" once — none of
// them deliberately toggled busy under the new meaning.
//
// Call:
//   curl -X POST https://karvia.services/api/admin/migrate/reset-workstatus \
//        -H "Content-Type: application/json" \
//        -d '{"adminSecret":"<ADMIN_SECRET_PASSWORD>"}'
export async function POST(request) {
  try {
    let body = {};
    try { body = await request.json(); } catch {}
    const expectedSecret = process.env.ADMIN_SECRET_PASSWORD;
    if (!expectedSecret || !body?.adminSecret || !safeCompare(body.adminSecret, expectedSecret)) {
      return unauthorized();
    }

    await connectDB();
    const result = await Worker.updateMany(
      { workStatus: "working" },
      { $set: { workStatus: "free" } }
    );

    return ok({
      message: "Reset stale workStatus to free",
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  } catch (err) {
    console.error("reset-workstatus error:", err);
    return error("Migration failed: " + err.message, 500);
  }
}
