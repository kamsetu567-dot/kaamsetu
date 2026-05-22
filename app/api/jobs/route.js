import { connectDB } from "@/lib/db/mongoose";
import JobRequest from "@/lib/models/JobRequest";
import Worker from "@/lib/models/Worker";
import Client from "@/lib/models/Client";
import { ok, error, created } from "@/lib/utils/apiResponse";
import { getTokenFromRequest, verifyToken } from "@/lib/utils/jwt";

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
        // Pending jobs are unassigned — filter by the worker's category + city
        const workerProfile = await Worker.findOne({ user: workerId }).lean();
        if (workerProfile) {
          const workerCoords = workerProfile.location?.coordinates?.coordinates;
          const radiusKm = parseInt(searchParams.get("radius") || "50");

          if (workerCoords?.length === 2) {
            // Use MongoDB geospatial query
            const pipeline = [
              {
                $geoNear: {
                  near: { type: "Point", coordinates: workerCoords },
                  distanceField: "distanceMeters",
                  maxDistance: radiusKm * 1000,
                  spherical: true,
                  query: {
                    status: "pending",
                    ...(workerProfile.category && {
                      category: { $regex: workerProfile.category, $options: "i" },
                    }),
                  },
                },
              },
              { $sort: { distanceMeters: 1 } },
              { $limit: 50 },
            ];

            const geoJobs = await JobRequest.aggregate(pipeline);

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

          // Fallback: no coordinates saved — use city match as before
          if (workerProfile.category) {
            filter.category = { $regex: workerProfile.category, $options: "i" };
          }
          if (workerProfile.location?.city) {
            filter["location.city"] = { $regex: workerProfile.location.city, $options: "i" };
          }
        }
      } else {
        // For job history, filter by Worker._id
        const workerProfile = await Worker.findOne({ user: workerId }).lean();
        if (workerProfile) filter.worker = workerProfile._id;
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
    const body = await request.json();

    const clientMobile = body.clientMobile || body.mobile;
    const clientName = body.clientName || body.name;
    const category = body.category || "General";
    const city = body.city || body.location || "Unknown";

    if (!clientMobile) {
      return error("clientMobile is required");
    }

    await connectDB();

    // clientId is derived only from the auth token — never accepted from request body
    let clientId = null;
    const token = getTokenFromRequest(request);
    if (token) {
      const payload = verifyToken(token);
      if (payload?.id) {
        const clientDoc = await Client.findOne({ user: payload.id }).lean();
        if (clientDoc) clientId = clientDoc._id;
      }
    }

    const jobData = {
      clientMobile,
      clientName: clientName || null,
      category,
      subcategory: body.subcategory || "",
      description: body.description || body.notes || "",
      location: {
        address: body.location || "",
        city,
        ...(body.lat && body.lng && {
          coordinates: {
            type: "Point",
            coordinates: [parseFloat(body.lng), parseFloat(body.lat)],
          },
        }),
      },
      status: "pending",
      source: body.source || "search",
      clientId: clientId || null,
    };

    if (body.workerId) {
      const worker = await Worker.findById(body.workerId).lean();
      const now = new Date();
      if (worker && worker.status === "approved" && worker.subscriptionExpiry && worker.subscriptionExpiry > now) {
        jobData.worker = body.workerId;
      } else if (worker && worker.status !== "approved") {
        return error("Worker is not available for assignment", 400);
      }
    }

    let job;
    try {
      job = await JobRequest.create(jobData);
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
