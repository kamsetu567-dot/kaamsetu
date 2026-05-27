import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";

// One-time admin migration: drops collection-level indexes that the current
// Mongoose schemas no longer declare. Atlas keeps old indexes alive after a
// schema rename, which leads to surprises like the shops collection's stale
// `userId_1` unique index rejecting new signups with E11000 "dup key
// { userId: null }". This route inspects each known collection and drops any
// index whose name isn't on its allow-list. Idempotent — safe to call twice.
//
// Call: POST /api/admin/migrate/drop-orphan-indexes
export async function POST(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") return unauthorized();

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
