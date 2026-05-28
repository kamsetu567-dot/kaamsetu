import { randomInt } from "crypto";
import { connectDB } from "@/lib/db/mongoose";
import JobRequest from "@/lib/models/JobRequest";
import Worker from "@/lib/models/Worker";
import Client from "@/lib/models/Client";
import User from "@/lib/models/User";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized, notFound } from "@/lib/utils/apiResponse";
import { sendJobAcceptedEmail } from "@/lib/utils/email";

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

    // Step 1 — Atomically claim the worker slot. The filter checks all
    // accept-time invariants (free, approved, valid subscription) in one shot,
    // closing the TOCTOU window between read and write.
    const claimedWorker = await Worker.findOneAndUpdate(
      {
        _id: worker._id,
        workStatus: "free",
        status: "approved",
        subscriptionExpiry: { $gt: new Date() },
      },
      { $set: { workStatus: "working" } }
    );
    if (!claimedWorker) {
      // Atomic claim failed — re-read once to give a specific error
      const fresh = await Worker.findById(worker._id).lean();
      if (!fresh) return error("Worker profile not found");
      if (fresh.status !== "approved") return error("Your account is not approved yet.", 403);
      if (!fresh.subscriptionExpiry || fresh.subscriptionExpiry < new Date()) {
        return error("Your subscription has expired. Please renew to accept jobs.", 403);
      }
      return error("You already have an active job. Complete it before accepting a new one.", 409);
    }

    // Step 2 — Atomically claim the job: only succeeds if still pending AND
    // either unassigned or pre-assigned to this specific worker. Also mint a
    // 4-digit start code the client will give the worker in person.
    const startCode = String(randomInt(1000, 10000));
    const job = await JobRequest.findOneAndUpdate(
      { _id: id, status: "pending", worker: { $in: [null, worker._id] } },
      { $set: { status: "accepted", worker: worker._id, startCode } },
      { new: true }
    );
    if (!job) {
      // Job was already taken or assigned to someone else — release the worker slot
      await Worker.findByIdAndUpdate(worker._id, { $set: { workStatus: "free" } });
      return error("Job is no longer available.", 409);
    }

    // Fire-and-forget: email the client that their job was accepted
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

    return ok({
      message: "Job accepted. The client will call you shortly.",
    });
  } catch (err) {
    console.error("POST /api/jobs/[id]/accept error:", err);
    return error("Server error", 500);
  }
}
