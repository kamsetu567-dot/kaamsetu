import mongoose from "mongoose";
import { timingSafeEqual } from "crypto";
import { connectDB } from "@/lib/db/mongoose";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";

function safeCompare(a, b) {
  try {
    return timingSafeEqual(Buffer.from(a || "", "utf8"), Buffer.from(b || "", "utf8"));
  } catch {
    return false; // buffers of different lengths
  }
}

// One-time admin migration: drops collection-level indexes that the current
// Mongoose schemas no longer declare. Atlas keeps old indexes alive after a
// schema rename, which leads to surprises like the shops collection's stale
// `userId_1` unique index rejecting new signups with E11000 "dup key
// { userId: null }". This route inspects each known collection and drops any
// index whose name isn't on its allow-list. Idempotent — safe to call twice.
//
// Auth (either):
//   - Admin JWT in `Authorization: Bearer <token>` header. Best when called
//     from the admin DevTools console on the SAME ORIGIN as the admin app
//     (i.e. `karvia.services`). Note: browsers strip the Authorization
//     header across origin redirects, so calling from the apex domain
//     (without `www`) will fail with 401.
//   - `adminSecret` in the request body matched against ADMIN_SECRET_PASSWORD
//     env var. Use this when calling from curl / a script.
//
// Call (header):
//   POST /api/admin/migrate/drop-orphan-indexes
//   Authorization: Bearer <admin-jwt>
//
// Call (body secret):
//   curl -X POST https://karvia.services/api/admin/migrate/drop-orphan-indexes \
//        -H "Content-Type: application/json" \
//        -d '{"adminSecret":"<ADMIN_SECRET_PASSWORD>"}'
export async function POST(request) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch {
      // No body / not JSON — fine, header auth path may still allow it.
    }

    const token = getTokenFromRequest(request);
    const payload = token ? verifyToken(token) : null;
    const headerOk = payload?.role === "admin";

    const expectedSecret = process.env.ADMIN_SECRET_PASSWORD;
    const bodyOk = expectedSecret && body?.adminSecret && safeCompare(body.adminSecret, expectedSecret);

    if (!headerOk && !bodyOk) return unauthorized();

    await connectDB();
    const db = mongoose.connection.db;

    // For each collection, list indexes the current schema actually wants.
    // `_id_` is always kept (Mongo built-in). Anything else not in the
    // allow-list gets dropped.
    const expected = {
      shops: ["_id_", "user_1", "mobile_1"],
      clients: ["_id_", "user_1", "mobile_1"],
      workers: [
        "_id_",
        "mobile_1",
        "status_1_workStatus_1",
        "category_1",
        "location.city_1",
        "location.coordinates_2dsphere",
      ],
      jobrequests: [
        "_id_",
        "status_1",
        "worker_1",
        "createdAt_-1",
        "location.coordinates_2dsphere",
      ],
    };

    const dropped = {};
    const errors = {};

    for (const [collectionName, allowed] of Object.entries(expected)) {
      dropped[collectionName] = [];
      try {
        const indexes = await db.collection(collectionName).indexes();
        for (const idx of indexes) {
          if (!allowed.includes(idx.name)) {
            try {
              await db.collection(collectionName).dropIndex(idx.name);
              dropped[collectionName].push(idx.name);
            } catch (dropErr) {
              errors[`${collectionName}.${idx.name}`] = dropErr.message;
            }
          }
        }
      } catch (listErr) {
        // Collection may not exist yet — that's fine, skip it
        if (!String(listErr.message || "").includes("ns does not exist")) {
          errors[collectionName] = listErr.message;
        }
      }
    }

    return ok({
      message: "Orphan-index sweep complete",
      dropped,
      errors: Object.keys(errors).length ? errors : undefined,
    });
  } catch (err) {
    console.error("drop-orphan-indexes error:", err);
    return error("Migration failed: " + err.message, 500);
  }
}
