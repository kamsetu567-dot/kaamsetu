import { connectDB } from "@/lib/db/mongoose";
import JobRequest from "@/lib/models/JobRequest";
import Worker from "@/lib/models/Worker";
import Client from "@/lib/models/Client";
import { ok, error, created, unauthorized } from "@/lib/utils/apiResponse";
import { getTokenFromRequest, verifyToken } from "@/lib/utils/jwt";
import { sendAdminNewJobEmail } from "@/lib/utils/email";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get("workerId");
    const status = searchParams.get("status");

    await connectDB();

    const filter = {};
    if (status) filter.status = status;

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

        const workerCoords = workerProfile.location?.coordinates?.coordinates;
        const radiusKm = parseInt(searchParams.get("radius") || "50");

        if (workerCoords?.length === 2) {
          // Geospatial query when worker has GPS coordinates saved
          const geoQuery = {
            status: "pending",
            dismissedBy: { $nin: [workerProfile._id] },
            // Only show unassigned jobs OR jobs specifically routed to this worker
            worker: { $in: [null, workerProfile._id] },
          };
          if (workerProfile.category) {
            geoQuery.category = workerProfile.category;
          }

          const pipeline = [
            {
              $geoNear: {
                near: { type: "Point", coordinates: workerCoords },
                distanceField: "distanceMeters",
                maxDistance: radiusKm * 1000,
                spherical: true,
                query: geoQuery,
              },
            },
            { $sort: { distanceMeters: 1 } },
            { $limit: 50 },
          ];

          const geoJobs = await JobRequest.aggregate(pipeline);

          // If geo found jobs, return them; otherwise fall through to city-based match
          if (geoJobs.length > 0) {
            return ok({
              jobs: geoJobs.map((j) => ({
                id: j._id,
                category: j.category,
                subcategory: j.subcategory,
                description: j.description,
                location: j.location?.city || j.location?.address || "",
                locationAddress: j.location?.address || "",
                distanceKm: j.distanceMeters ? parseFloat((j.distanceMeters / 1000).toFixed(1)) : null,
                status: j.status,
                source: j.source,
                worker: j.worker,
                createdAt: j.createdAt,
              })),
            });
          }
        }

        // City-based fallback: used when no GPS saved OR geo returned 0 results
        filter.dismissedBy = { $nin: [workerProfile._id] };
        // Only show unassigned jobs OR jobs specifically routed to this worker
        filter.worker = { $in: [null, workerProfile._id] };
        if (workerProfile.category) {
          filter.category = workerProfile.category;
        }
        if (workerProfile.location?.city) {
          filter["location.city"] = { $regex: workerProfile.location.city, $options: "i" };
        }
      } else {
        // Job history: return jobs assigned to this worker (any status)
        const workerProfile = await Worker.findOne({ user: workerId }).lean();
        if (!workerProfile) return ok({ jobs: [] });
        filter.worker = workerProfile._id;
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
        // clientMobile and clientName intentionally omitted — exposed only on job accept
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
    const jobLocation = {
      address: loc.address || legacyAddress || "",
      locality: loc.locality || "",
      city: loc.city || body.city || "Unknown",
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
