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
        // workerId here is the User._id from the JWT payload
        const workerProfile = await Worker.findOne({ user: workerId }).lean();
        if (workerProfile) {
          if (workerProfile.category) {
            filter.category = { $regex: workerProfile.category, $options: "i" };
          }
          if (workerProfile.location?.city) {
            filter["location.city"] = { $regex: workerProfile.location.city, $options: "i" };
          }
        }
        // If no worker profile found, show all pending jobs (fallback)
      } else {
        // For non-pending jobs (history), filter by Worker._id
        const workerProfile = await Worker.findOne({ user: workerId }).lean();
        if (workerProfile) filter.worker = workerProfile._id;
      }
    }

    const jobs = await JobRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return ok({ jobs: jobs.map(j => ({ ...j, id: j._id })) });
  } catch (err) {
    console.error("GET /api/jobs error:", err);
    return error("Server error", 500);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("Job request received:", JSON.stringify(body));

    const clientMobile = body.clientMobile || body.mobile;
    const clientName = body.clientName || body.name;
    const category = body.category || "General";
    const city = body.city || body.location || "Unknown";

    if (!clientMobile) {
      return error("clientMobile is required");
    }

    await connectDB();

    // Resolve clientId: use body value, or look up from auth token
    let clientId = body.clientId || null;
    if (!clientId) {
      const token = getTokenFromRequest(request);
      if (token) {
        const payload = verifyToken(token);
        if (payload?.id) {
          const clientDoc = await Client.findOne({ user: payload.id }).lean();
          if (clientDoc) clientId = clientDoc._id;
        }
      }
    }

    const jobData = {
      clientMobile,
      clientName: clientName || null,
      category,
      subcategory: body.subcategory || "",
      description: body.description || body.notes || "",
      location: { address: body.location || "", city },
      status: "pending",
      source: body.source || "search",
      clientId: clientId || null,
    };

    if (body.workerId) {
      const worker = await Worker.findById(body.workerId).lean();
      if (worker) jobData.worker = body.workerId;
    }

    let job;
    try {
      job = await JobRequest.create(jobData);
      console.log("Job request created:", job._id);
    } catch (createError) {
      console.error("JobRequest create failed:", createError.message);
      return error(`Job creation failed: ${createError.message}`, 500);
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
