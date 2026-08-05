import { connectDB } from "@/lib/db/mongoose";
import Worker from "@/lib/models/Worker";
import { ok, error } from "@/lib/utils/apiResponse";
import { cityRegex } from "@/lib/utils/cityMatch";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const category = searchParams.get("category") || "";
    const subcategory = searchParams.get("subcategory") || "";
    const gender = searchParams.get("gender") || "";
    const serviceType = searchParams.get("serviceType") || "";
    const employmentType = searchParams.get("employmentType") || "";
    const experienceLevel = searchParams.get("experienceLevel") || "";
    const sortBy = searchParams.get("sortBy") || "rating";
    const rating = parseFloat(searchParams.get("rating")) || 0;
    const city = searchParams.get("city") || "";
    const lat = parseFloat(searchParams.get("lat"));
    const lng = parseFloat(searchParams.get("lng"));
    const distance = parseInt(searchParams.get("distance"), 10) || 0;

    const filter = { status: "approved" };

    if (category) filter.category = { $regex: category, $options: "i" };
    if (subcategory) filter.subcategory = { $regex: subcategory, $options: "i" };
    if (gender) filter.gender = gender;
    if (serviceType) filter.serviceType = { $in: [serviceType, "both"] };
    if (employmentType) filter.employmentType = { $in: [employmentType, "any"] };
    if (experienceLevel === "fresher") filter.experience = 0;
    if (experienceLevel === "experienced") filter.experience = { $gt: 0 };
    if (rating > 0) filter.rating = { $gte: rating };
    if (city) { const cr = cityRegex(city); if (cr) filter["location.city"] = cr; }

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { subcategory: { $regex: query, $options: "i" } },
      ];
    }

    // Whether the caller supplied usable GPS coordinates at all. The radius
    // chip (`distance`) only controls the CUTOFF — with GPS but no chip we
    // still $geoNear (unbounded) so every card gets its real km figure and
    // "sort by distance" actually works.
    const hasGeo = Number.isFinite(lat) && Number.isFinite(lng);

    const sortMap = {
      rating: { boosted: -1, rating: -1 },
      newest: { createdAt: -1 },
      // Real nearest-first when GPS gave us distanceMeters; otherwise there is
      // nothing to sort by, so fall back to rating. (This used to be
      // `{ rating: -1 }` unconditionally — the Distance sort option silently
      // reordered $geoNear's nearest-first output back to rating order.)
      distance: hasGeo ? { distanceMeters: 1 } : { rating: -1 },
    };
    const sort = sortMap[sortBy] || sortMap.rating;

    // If the client only has a city (no GPS) and a distance chip is selected,
    // fall back to a city-name match so "nearby" still means *something*. This
    // also catches workers who typed their address rather than tapping GPS.
    const hasCityFallback = !hasGeo && distance > 0 && city;
    if (hasCityFallback) {
      const cr = cityRegex(city);
      if (cr) filter["location.city"] = cr;
    }
    const now = new Date();

    // Self-heal: clear boosted flags whose boostedUntil has passed, so the
    // `boosted: -1` sort doesn't keep floating stale boosts to the top.
    // Non-blocking — if it fails the response formatter still recomputes the
    // boosted badge correctly via (boosted && boostedUntil > now).
    await Worker.updateMany(
      { boosted: true, boostedUntil: { $lte: now } },
      { $set: { boosted: false } }
    ).catch(() => {});

    let workers;
    if (hasGeo) {
      const pipeline = [
        {
          $geoNear: {
            near: { type: "Point", coordinates: [lng, lat] },
            distanceField: "distanceMeters",
            // Radius cutoff only when a distance chip is active; otherwise
            // unbounded — we just want each worker's km for display/sort.
            ...(distance > 0 ? { maxDistance: distance * 1000 } : {}),
            spherical: true,
            query: filter,
          },
        },
        { $sort: sort },
        { $limit: 50 },
      ];
      workers = await Worker.aggregate(pipeline);

      // $geoNear silently excludes workers without coordinates. Many workers
      // typed their address (no GPS) — they'd be invisible. Bring them back in
      // via a city-name match so the radius chip doesn't hide real workers.
      // (Guard the limit: .limit(0) means UNLIMITED in Mongo, not zero.)
      if (city && workers.length < 50) {
        const seen = new Set(workers.map(w => String(w._id)));
        // The geo path may sort by distanceMeters, which city-only workers
        // don't have — sort those by rating instead.
        const citySort = sortBy === "distance" ? sortMap.rating : sort;
        const cityOnly = await Worker.find({
          ...filter,
          _id: { $nin: workers.map(w => w._id) },
          "location.city": cityRegex(city) || { $regex: "", $options: "i" },
          $or: [
            { "location.coordinates": { $exists: false } },
            { "location.coordinates": null },
            { "location.coordinates.coordinates": { $exists: false } },
          ],
        })
          .sort(citySort)
          .limit(50 - workers.length)
          .select("-__v")
          .lean();
        for (const w of cityOnly) {
          if (!seen.has(String(w._id))) workers.push(w);
        }
      }
    } else {
      workers = await Worker.find(filter)
        .sort(sort)
        .limit(50)
        .select("-__v")
        .lean();
    }

    const formatted = workers.map(w => ({
      id: w._id,
      name: w.name,
      photo: w.photo,
      category: w.category,
      subcategory: w.subcategory,
      gender: w.gender,
      experience: w.experience,
      serviceType: w.serviceType,
      status: w.workStatus || "free",
      rating: w.rating,
      location: w.location,
      distance: typeof w.distanceMeters === "number" ? parseFloat((w.distanceMeters / 1000).toFixed(1)) : undefined,
      boosted: w.boosted && w.boostedUntil > now,
      subscriptionActive: w.subscriptionExpiry ? w.subscriptionExpiry > now : false,
      employmentType: w.employmentType || "any",
      skills: w.skills || [],
    }));

    return ok({ workers: formatted });
  } catch (err) {
    console.error("GET /api/workers error:", err);
    return error("Server error", 500);
  }
}
