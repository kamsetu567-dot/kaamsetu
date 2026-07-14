import { connectDB } from "@/lib/db/mongoose";
import JobRequest from "@/lib/models/JobRequest";
import Worker from "@/lib/models/Worker";
import Client from "@/lib/models/Client";
import { ok, error, created, unauthorized } from "@/lib/utils/apiResponse";
import { getTokenFromRequest, verifyToken } from "@/lib/utils/jwt";
import { sendAdminNewJobEmail } from "@/lib/utils/email";
import { exactCityRegex, isUsableCity } from "@/lib/utils/cityMatch";
import { haversineKm, coordsOf } from "@/lib/utils/geo";
import { mapplsReverse } from "@/lib/utils/mappls";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get("workerId");
    const status = searchParams.get("status");

    await connectDB();

    const filter = {};
    if (status) filter.status = status;

    // True only for the worker's own job history (assigned jobs). In that case
    // the worker may see the client's contact — it's their own client to reach.
    // The open-feed (pending) branch must NOT expose contact before accepting.
    let isOwnHistory = false;

    if (workerId) {
      if (status === "pending") {
        const workerProfile = await Worker.findOne({ user: workerId }).lean();

        // Only approved workers see jobs
        if (!workerProfile || workerProfile.status !== "approved") {
          return ok({ jobs: [] });
        }
        // Workers with lapsed subscriptions can't accept jobs — hide the feed
        // so they're not staring at clickable-but-broken cards
        if (!workerProfile.subscriptionExpiry || workerProfile.subscriptionExpiry < new Date()) {
          return ok({ jobs: [] });
        }
        // Busy workers (manually toggled, or mid-job) get no new job
        // notifications. Flipping back to "free" resumes the feed.
        if (workerProfile.workStatus === "working") {
          return ok({ jobs: [] });
        }

        // ── City is the gate ────────────────────────────────────────────
        // A job posted in Jind must reach Jind workers and nobody else. City is
        // therefore a HARD filter on the open pool, and it FAILS CLOSED: a
        // worker with no city saved sees nothing (previously the filter was
        // simply skipped, so they saw every pending job in the country).
        //
        // Distance is NOT a gate. The old code ran $geoNear with a 50 km radius
        // that ignored city entirely (a Jind worker saw Kaithal jobs), and
        // $geoNear silently drops jobs that have no coordinates — so same-city
        // jobs posted without GPS disappeared whenever one GPS job was in range.
        // Distance is now computed in JS purely to order the results.
        const cityCond = exactCityRegex(workerProfile.location?.city);

        const feedFilter = {
          status: "pending",
          dismissedBy: { $nin: [workerProfile._id] },
          $or: [
            // Jobs the client routed to this worker by name always reach them,
            // even from another city — the client picked them deliberately.
            { worker: workerProfile._id },
            // The open pool is city-gated. Omitted entirely when the worker has
            // no city, which is what makes the feed fail closed.
            ...(cityCond
              ? [{
                  worker: null,
                  "location.city": cityCond,
                  ...(workerProfile.category ? { category: workerProfile.category } : {}),
                }]
              : []),
          ],
        };

        const docs = await JobRequest.find(feedFilter)
          .sort({ createdAt: -1 })
          .limit(100)
          .lean();

        const workerCoords = coordsOf(workerProfile.location);
        const scored = docs.map(j => {
          const jobCoords = coordsOf(j.location);
          return {
            job: j,
            distanceKm: workerCoords && jobCoords
              ? parseFloat(haversineKm(workerCoords, jobCoords).toFixed(1))
              : null,
          };
        });

        // Nearest first when both sides have GPS. Jobs with no distance sort
        // after the located ones (newest-first among themselves) but are never
        // dropped — that silent drop was the old bug.
        scored.sort((a, b) => {
          if (a.distanceKm == null && b.distanceKm == null) {
            return new Date(b.job.createdAt) - new Date(a.job.createdAt);
          }
          if (a.distanceKm == null) return 1;
          if (b.distanceKm == null) return -1;
          return a.distanceKm - b.distanceKm;
        });

        return ok({
          jobs: scored.slice(0, 50).map(({ job: j, distanceKm }) => ({
            id: j._id,
            category: j.category,
            subcategory: j.subcategory,
            description: j.description,
            location: j.location?.city || j.location?.address || "",
            locationAddress: j.location?.address || "",
            distanceKm,
            status: j.status,
            source: j.source,
            worker: j.worker,
            createdAt: j.createdAt,
          })),
          // Drives the "add your city" banner — without it the worker just sees
          // an empty feed and never learns why.
          cityMissing: !cityCond,
        });
      } else {
        // Job history: return jobs assigned to this worker (any status)
        const workerProfile = await Worker.findOne({ user: workerId }).lean();
        if (!workerProfile) return ok({ jobs: [] });
        filter.worker = workerProfile._id;
        isOwnHistory = true;
      }
    }

    const jobs = await JobRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return ok({
      jobs: jobs.map(j => ({
        id: j._id,
        category: j.category,
        subcategory: j.subcategory,
        description: j.description,
        location: j.location?.city || j.location?.address || "",
        status: j.status,
        source: j.source,
        worker: j.worker,
        createdAt: j.createdAt,
        // Client contact is exposed ONLY on the worker's own history (their
        // assigned jobs) — never on the open pending feed before acceptance.
        ...(isOwnHistory ? {
          clientName: j.clientName || null,
          clientMobile: j.clientMobile || null,
          clientAddress: j.location?.address || "",
          clientCity: j.location?.city || "",
        } : {}),
      })),
    });
  } catch (err) {
    console.error("GET /api/jobs error:", err);
    return error("Server error", 500);
  }
}

export async function POST(request) {
  try {
    // Require authenticated client — prevents unauthenticated job spam
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized("Login required to post a job");
    const payload = verifyToken(token);
    if (!payload || payload.role !== "client") return unauthorized("Client access required");

    const body = await request.json();

    const category = body.category || "General";

    await connectDB();

    // clientMobile and clientId always come from the authenticated session — never from the body
    const clientDoc = await Client.findOne({ user: payload.id }).lean();
    if (!clientDoc) return error("Client profile not found", 404);
    const clientId = clientDoc._id;
    const clientMobile = clientDoc.mobile;
    const clientName = clientDoc.name || body.clientName || null;

    // Accept structured `location` (from AddressAutocomplete) and fall back to legacy
    // flat `city`/`location` string + top-level lat/lng so older clients still post.
    const isStructuredLocation = body.location && typeof body.location === "object";
    const loc = isStructuredLocation ? body.location : {};
    const legacyAddress = isStructuredLocation ? "" : (body.location || "");
    const latVal = loc.lat ?? body.lat;
    const lngVal = loc.lng ?? body.lng;

    // The city decides who can see this job, so it has to be real. Resolve it:
    // form → the client's saved profile city → reverse-geocode the posted GPS
    // (the address picker can return coords but no city) → give up and reject.
    // The old fallback was the literal string "Unknown", which produced jobs no
    // worker could ever match — a silent black hole.
    let city = [loc.city, body.city].find(isUsableCity)?.trim() || "";
    if (!city && isUsableCity(clientDoc.location?.city)) {
      city = clientDoc.location.city.trim();
    }
    if (!city && latVal && lngVal) {
      const reversed = await mapplsReverse(parseFloat(latVal), parseFloat(lngVal)).catch(() => null);
      if (isUsableCity(reversed?.city)) city = reversed.city.trim();
    }
    if (!city) {
      return error(
        "अपना शहर चुनें — request सिर्फ उसी शहर के workers को दिखेगी / Please pick a location with a city so nearby workers can see this request.",
        400
      );
    }

    const jobLocation = {
      address: loc.address || legacyAddress || "",
      locality: loc.locality || "",
      city,
      state: loc.state || "",
      pincode: loc.pincode || "",
      ...(latVal && lngVal && {
        coordinates: {
          type: "Point",
          coordinates: [parseFloat(lngVal), parseFloat(latVal)],
        },
      }),
    };

    const jobData = {
      clientMobile,
      clientName: clientName || null,
      category,
      subcategory: body.subcategory || "",
      description: body.description || body.notes || "",
      location: jobLocation,
      status: "pending",
      source: body.source || "search",
      clientId,
    };

    if (body.workerId) {
      const worker = await Worker.findById(body.workerId).lean();
      const now = new Date();
      if (worker && worker.status === "approved" && worker.subscriptionExpiry && worker.subscriptionExpiry > now) {
        jobData.worker = body.workerId;
      } else if (worker && worker.status !== "approved") {
        return error("Worker is not available for assignment", 400);
      } else if (worker) {
        // Approved but subscription lapsed — don't silently dump into the open
        // pool; tell the client this specific worker isn't currently available.
        return error("This worker is not currently available. Please choose another.", 400);
      }
    }

    let job;
    try {
      job = await JobRequest.create(jobData);
      // Fire-and-forget email to admin
      if (process.env.ADMIN_EMAIL) {
        sendAdminNewJobEmail(process.env.ADMIN_EMAIL, jobData).catch(e => console.error("Admin email failed:", e));
      }
    } catch (createError) {
      console.error("JobRequest create failed:", createError.message);
      return error("Job submission failed. Please try again.", 500);
    }

    return created({
      message: "Job request submitted. Worker will contact you soon.",
      jobId: job._id,
    });
  } catch (err) {
    console.error("POST /api/jobs error:", err);
    return error("Server error", 500);
  }
}
