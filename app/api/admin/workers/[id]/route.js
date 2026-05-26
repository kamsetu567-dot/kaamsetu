import { connectDB } from "@/lib/db/mongoose";
import Worker from "@/lib/models/Worker";
import User from "@/lib/models/User";
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
    const { action, reason } = await request.json();

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
      await Worker.findByIdAndUpdate(id, { status: "approved" });
      await User.findByIdAndUpdate(worker.user, { status: "active" });
      return ok({ message: "Worker unblocked", status: "approved" });
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

    if (action === "extend") {
      const days = 30;
      const now = new Date();
      const base = worker.subscriptionExpiry && worker.subscriptionExpiry > now
        ? worker.subscriptionExpiry
        : now;
      const newExpiry = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
      await Worker.findByIdAndUpdate(id, { subscriptionExpiry: newExpiry });
      return ok({ message: `Subscription extended by ${days} days`, expiresAt: newExpiry });
    }

    const update = actionMap[action];
    if (!update) return error("Invalid action");

    await Worker.findByIdAndUpdate(id, { status: update.status });

    if (action === "approve") {
      const user = await User.findById(worker.user).select("email name").lean();
      if (user?.email) {
        sendApprovalEmail(user.email, worker.name || user.name).catch(() => {});
      }
    }

    return ok({ message: `Worker ${action}d`, status: update.status });
  } catch (err) {
    console.error("admin PATCH worker error:", err);
    return error("Server error", 500);
  }
}
