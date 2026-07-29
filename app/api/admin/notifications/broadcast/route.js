import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/models/User";
import Worker from "@/lib/models/Worker";
import Notification from "@/lib/models/Notification";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";
import { sendBroadcastEmail } from "@/lib/utils/email";

// Map the broadcast page's audience values to the Notification model's enum.
// "free" / "working" don't have direct Notification equivalents (the model
// only knows about roles), so they degrade to "worker" — the bell is broader
// than the email blast, which is acceptable. Document this so future readers
// don't think it's a bug.
function audienceToBellEnum(audience) {
  if (audience === "clients") return "client";
  if (audience === "workers" || audience === "free" || audience === "working") return "worker";
  return "all";
}

function adminGuard(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.role === "admin" ? payload : null;
}

function cleanEmails(arr) {
  return (arr || []).filter(e => typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
}

async function getTargetEmails(audience) {
  const baseFilter = { email: { $type: "string", $ne: "" } };
  // Query the `roles` array (Mongo's `{ field: value }` matches "value in array")
  // so we catch multi-role users where the legacy `role` mirror points at a
  // different role than the one they signed up with second.
  switch (audience) {
    case "workers":
      return cleanEmails(await User.find({ roles: "worker", ...baseFilter }).distinct("email"));
    case "clients":
      return cleanEmails(await User.find({ roles: "client", ...baseFilter }).distinct("email"));
    case "free":
    case "working": {
      const workers = await Worker.find({ workStatus: audience === "free" ? "free" : "working" })
        .populate({ path: "user", select: "email" })
        .lean();
      return cleanEmails(workers.map(w => w.user?.email));
    }
    default: // "all"
      return cleanEmails(await User.find({ roles: { $in: ["worker", "client"] }, ...baseFilter }).distinct("email"));
  }
}

export async function POST(request) {
  try {
    if (!adminGuard(request)) return unauthorized();
    const { audience = "all", message } = await request.json();
    if (!message?.trim()) return error("Message is required");

    await connectDB();

    // Always persist to the Notification model so the user navbar bell shows
    // the broadcast — even if the email blast has zero deliverable addresses
    // (users without an email row can still see the bell). The bell entry is
    // the canonical record; email is best-effort delivery.
    const trimmed = message.trim();
    await Notification.create({
      title: "Karvia Update",
      body: trimmed,
      audience: audienceToBellEnum(audience),
      active: true,
    }).catch(err => {
      // Bell write failure shouldn't kill the broadcast — log and continue.
      console.error("Notification.create failed during broadcast:", err.message);
    });

    const emails = await getTargetEmails(audience);
    if (!emails.length) {
      // Bell entry is already saved above, so a "no email targets" case still
      // surfaces to users via the bell. Report honestly.
      return ok({
        message: "Saved to in-app bell. No email addresses found for this audience.",
        sent: 0,
        total: 0,
      });
    }

    const result = await sendBroadcastEmail(emails, trimmed);
    return ok({
      message: `Sent to ${result.sent}/${result.total} via email, plus in-app bell.`,
      sent: result.sent,
      total: result.total,
      failures: result.failures?.length || 0,
    });
  } catch (err) {
    console.error("POST /api/admin/notifications/broadcast error:", err);
    return error("Failed to send notification", 500);
  }
}
