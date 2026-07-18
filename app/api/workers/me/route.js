import { connectDB } from "@/lib/db/mongoose";
import Worker from "@/lib/models/Worker";
import User from "@/lib/models/User";
import { getTokenFromRequest, verifyToken } from "@/lib/utils/jwt";
import { mapplsReverse } from "@/lib/utils/mappls";
import { stripDistrictSuffix } from "@/lib/utils/cityMatch";
import { ok, unauthorized, forbidden, notFound, error } from "@/lib/utils/apiResponse";

export async function PATCH(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload) return unauthorized("Invalid or expired token");
    if (payload.role !== "worker") return forbidden("Worker access required");

    const body = await request.json();
    // Explicit allow-list — never trust raw body keys for partial updates.
    const allowed = ["location"];
    const update = {};
    for (const k of allowed) if (body[k] !== undefined) update[k] = body[k];

    if (update.location) {
      const loc = update.location;
      // Guard against NaN: parseFloat("") / parseFloat("abc") → NaN, and NaN
      // would sail past a `!= null` check and get written as [NaN, NaN], which
      // the 2dsphere index rejects — failing the whole save with a generic
      // "Server error". Only accept finite numbers.
      const latNum = loc.lat != null ? parseFloat(loc.lat) : NaN;
      const lngNum = loc.lng != null ? parseFloat(loc.lng) : NaN;
      const lat = Number.isFinite(latNum) ? latNum : null;
      const lng = Number.isFinite(lngNum) ? lngNum : null;

      // Coords-only path (dashboard button): reverse-geocode to enrich the doc
      // with city/state/locality so the worker's city-based job matching works.
      let enriched = { ...loc };
      if (lat != null && lng != null && !loc.city) {
        const reversed = await mapplsReverse(lat, lng);
        if (reversed) {
          // Fill from the reverse-geocode, but let ONLY non-empty incoming
          // fields override it. The bug this fixes: `{ ...reversed, ...loc }`
          // spread an empty-string `loc.city` over the resolved city, saving a
          // blank city even though the lookup succeeded.
          const present = Object.fromEntries(
            Object.entries(loc).filter(([, v]) => v != null && v !== "")
          );
          enriched = { ...reversed, ...present, lat, lng };
        }
      }

      update.location = {
        address: enriched.address || "",
        locality: enriched.locality || "",
        // Strip a "District" suffix so a typed/geocoded "Muzaffarnagar District"
        // matches the "Muzaffarnagar" workers — same rule the job feed uses.
        city: stripDistrictSuffix(enriched.city || ""),
        state: enriched.state || "",
        pincode: enriched.pincode || "",
        ...(lat != null && lng != null ? {
          coordinates: { type: "Point", coordinates: [lng, lat] },
        } : {}),
      };
    }

    await connectDB();
    const worker = await Worker.findOneAndUpdate(
      { user: payload.id },
      { $set: update },
      { new: true }
    ).select("-__v").lean();
    if (!worker) return notFound("Worker not found");

    return ok({ worker: { ...worker, id: worker._id } });
  } catch (err) {
    console.error("PATCH /api/workers/me error:", err);
    return error("Server error", 500);
  }
}

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();

    const payload = verifyToken(token);
    if (!payload) return unauthorized("Invalid or expired token");

    if (payload.role !== "worker") return forbidden("Worker access required");

    await connectDB();

    const worker = await Worker.findOne({ user: payload.id }).select("-__v").lean();
    if (!worker) return notFound("Worker not found");

    const userDoc = await User.findById(worker.user).select("email").lean();

    return ok({ worker: { ...worker, id: worker._id, email: userDoc?.email || "" } });
  } catch (err) {
    console.error("GET /api/workers/me error:", err);
    return error("Server error", 500);
  }
}
