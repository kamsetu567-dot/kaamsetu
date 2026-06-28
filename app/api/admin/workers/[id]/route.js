import { connectDB } from "@/lib/db/mongoose";
import Worker from "@/lib/models/Worker";
import User from "@/lib/models/User";
import JobRequest from "@/lib/models/JobRequest";
import AdminSettings from "@/lib/models/AdminSettings";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized, notFound } from "@/lib/utils/apiResponse";
import { sendApprovalEmail } from "@/lib/utils/email";

export async function PATCH(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") return unauthorized();

    const { id } = await params;
    const { action, reason, days: daysRaw } = await request.json();

    await connectDB();

    const worker = await Worker.findById(id);
    if (!worker) return notFound("Worker not found");

    const actionMap = {
      approve:     { status: "approved" },
      reject:      { status: "rejected" },
      activate:    { status: "approved" },
      deactivate:  { status: "deactivated" },
    };

    if (action === "block") {
      await Worker.findByIdAndUpdate(id, { status: "blocked" });
      await User.findByIdAndUpdate(worker.user, { status: "blocked" });
      return ok({ message: "Worker blocked", status: "blocked" });
    }

    if (action === "unblock") {
      // Same subscription-window logic as approve/activate — without it an
      // unblocked worker with a past/null expiry still sees an empty job feed
      // and the unblock looks broken to them.
      const setting = await AdminSettings.findOne({ key: "approval_trial_days" }).lean();
      const trialDays = Number(setting?.value) > 0 ? Math.floor(Number(setting.value)) : 30;
      const now = new Date();
      const base = worker.subscriptionExpiry && worker.subscriptionExpiry > now
        ? worker.subscriptionExpiry
        : now;
      const subscriptionExpiry = new Date(base.getTime() + trialDays * 24 * 60 * 60 * 1000);
      await Worker.findByIdAndUpdate(id, { status: "approved", subscriptionExpiry });
      await User.findByIdAndUpdate(worker.user, { status: "active" });
      return ok({ message: "Worker unblocked", status: "approved", subscriptionExpiry });
    }

    if (action === "delete") {
      await Worker.findByIdAndDelete(id);
      await User.findByIdAndDelete(worker.user);
      return ok({ message: "Worker deleted" });
    }

    if (action === "boost") {
      const boostedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await Worker.findByIdAndUpdate(id, { boosted: true, boostedUntil });
      return ok({ message: "Worker boosted for 7 days", boostedUntil });
    }

    if (action === "recompute_rating") {
      const ratedJobs = await JobRequest.find({
        worker: id,
        clientRating: { $gte: 1, $lte: 5 },
      }).select("clientRating").lean();
      const totalRatings = ratedJobs.length;
      const sum = ratedJobs.reduce((acc, j) => acc + (j.clientRating || 0), 0);
      const avg = totalRatings > 0 ? Math.round((sum / totalRatings) * 100) / 100 : 0;
      await Worker.findByIdAndUpdate(id, { rating: avg, totalRatings });
      return ok({ message: `Recomputed: ${avg} stars from ${totalRatings} rating(s)`, rating: avg, totalRatings });
    }

    if (action === "extend") {
      const days = Number.isFinite(Number(daysRaw)) ? Math.floor(Number(daysRaw)) : 30;
      if (days < 1 || days > 365) {
        return error("Days must be an integer between 1 and 365", 400);
      }
      const now = new Date();
      const base = worker.subscriptionExpiry && worker.subscriptionExpiry > now
        ? worker.subscriptionExpiry
        : now;
      const newExpiry = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
      await Worker.findByIdAndUpdate(id, { subscriptionExpiry: newExpiry });
      return ok({ message: `Subscription extended by ${days} days`, expiresAt: newExpiry, days });
    }

    const update = actionMap[action];
    if (!update) return error("Invalid action");

    // Approving (or re-activating) a worker should also start/keep their
    // subscription window — otherwise the worker dashboard hides incoming
    // jobs ("/api/jobs" returns [] when subscriptionExpiry is null/past) and
    // it looks like approval didn't take. Default trial = 30 days; honor an
    // admin-configured override stored in AdminSettings.key="approval_trial_days".
    let subscriptionExpiry;
    if (action === "approve" || action === "activate") {
      const setting = await AdminSettings.findOne({ key: "approval_trial_days" }).lean();
      const trialDays = Number(setting?.value) > 0 ? Math.floor(Number(setting.value)) : 30;
      const now = new Date();
      const base = worker.subscriptionExpiry && worker.subscriptionExpiry > now
        ? worker.subscriptionExpiry
        : now;
      subscriptionExpiry = new Date(base.getTime() + trialDays * 24 * 60 * 60 * 1000);
    }

    await Worker.findByIdAndUpdate(id, {
      status: update.status,
      ...(subscriptionExpiry ? { subscriptionExpiry } : {}),
    });

    if (action === "approve") {
      const user = await User.findById(worker.user).select("email name").lean();
      if (user?.email) {
        sendApprovalEmail(user.email, worker.name || user.name).catch(() => {});
      }
    }

    return ok({
      message: `Worker ${action}d`,
      status: update.status,
      ...(subscriptionExpiry ? { subscriptionExpiry } : {}),
    });
  } catch (err) {
    console.error("admin PATCH worker error:", err);
    return error("Server error", 500);
  }
}
