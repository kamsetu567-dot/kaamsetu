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

async function getTargetEmails(audience) {
  switch (audience) {
    case "workers":
      return User.find({ role: "worker", email: { $ne: "" } }).distinct("email");
    case "clients":
      return User.find({ role: "client", email: { $ne: "" } }).distinct("email");
    case "free":
    case "working": {
      const workers = await Worker.find({ workStatus: audience === "free" ? "free" : "working" })
        .populate({ path: "user", select: "email" })
        .lean();
      return workers.map(w => w.user?.email).filter(Boolean);
    }
    default: // "all"
      return User.find({ role: { $in: ["worker", "client"] }, email: { $ne: "" } }).distinct("email");
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

    await sendBroadcastEmail(emails, message.trim());
    return ok({ message: `Notification sent to ${emails.length} user(s)`, sent: emails.length });
  } catch (err) {
    console.error("POST /api/admin/notifications/broadcast error:", err);
    return error("Failed to send notification", 500);
  }
}
