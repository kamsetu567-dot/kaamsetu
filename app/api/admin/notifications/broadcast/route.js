import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/models/User";
import Worker from "@/lib/models/Worker";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";
import { sendBroadcastEmail } from "@/lib/utils/email";

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
    const emails = await getTargetEmails(audience);
    if (!emails.length) return ok({ message: "No users found for this audience", sent: 0 });

    const result = await sendBroadcastEmail(emails, message.trim());
    return ok({
      message: `Notification sent to ${result.sent}/${result.total} user(s)`,
      sent: result.sent,
      total: result.total,
      failures: result.failures?.length || 0,
    });
  } catch (err) {
    console.error("POST /api/admin/notifications/broadcast error:", err);
    return error("Failed to send notification", 500);
  }
}
