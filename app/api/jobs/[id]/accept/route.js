import { randomInt } from "crypto";
import { connectDB } from "@/lib/db/mongoose";
import JobRequest from "@/lib/models/JobRequest";
import Worker from "@/lib/models/Worker";
import Client from "@/lib/models/Client";
import User from "@/lib/models/User";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized, notFound } from "@/lib/utils/apiResponse";
import { sendJobAcceptedEmail, sendClientDetailsEmail } from "@/lib/utils/email";

export async function POST(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();

    const payload = verifyToken(token);
    if (!payload || payload.role !== "worker") return unauthorized("Worker access required");

    const { id } = await params;
    await connectDB();

    const worker = await Worker.findOne({ user: payload.id }).lean();
    if (!worker) return error("Worker profile not found");

    // Accept-time eligibility: approved + valid subscription. workStatus is
    // NOT involved — it's purely the worker's notification toggle now, and a
    // worker may hold multiple active jobs at once.
    if (worker.status !== "approved") return error("Your account is not approved yet.", 403);
    if (!worker.subscriptionExpiry || worker.subscriptionExpiry < new Date()) {
      return error("Your subscription has expired. Please renew to accept jobs.", 403);
    }

    // Atomically claim the job: only succeeds if still pending AND either
    // unassigned or pre-assigned to this specific worker. Also mint a 4-digit
    // start code the client will give the worker in person.
    const startCode = String(randomInt(1000, 10000));
    const job = await JobRequest.findOneAndUpdate(
      { _id: id, status: "pending", worker: { $in: [null, worker._id] } },
      { $set: { status: "accepted", worker: worker._id, startCode } },
      { new: true }
    );
    if (!job) {
      return error("Job is no longer available.", 409);
    }

    // Fire-and-forget: email the client that their job was accepted (they get
    // the worker's name + phone).
    if (job.clientId) {
      Client.findById(job.clientId).lean().then(async clientDoc => {
        if (!clientDoc?.user) return;
        const userDoc = await User.findById(clientDoc.user).select("email name").lean();
        if (userDoc?.email) {
          sendJobAcceptedEmail(
            userDoc.email,
            userDoc.name || job.clientName,
            worker.name,
            worker.mobile,
            job.category,
            job.subcategory
          ).catch(() => {});
        }
      }).catch(() => {});
    }

    // Fire-and-forget: email the WORKER the client's details + job info so they
    // can reach out. (No start code — that's given in person.)
    User.findById(worker.user).select("email").lean().then(workerUser => {
      if (!workerUser?.email) return;
      sendClientDetailsEmail(workerUser.email, worker.name, {
        clientName: job.clientName,
        clientMobile: job.clientMobile,
        address: job.location?.address,
        city: job.location?.city,
        category: job.category,
        subcategory: job.subcategory,
        description: job.description,
      }).catch(() => {});
    }).catch(() => {});

    return ok({
      message: "Job accepted. Client details sent to your email.",
    });
  } catch (err) {
    console.error("POST /api/jobs/[id]/accept error:", err);
    return error("Server error", 500);
  }
}
