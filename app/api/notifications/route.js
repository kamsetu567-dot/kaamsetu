import { connectDB } from "@/lib/db/mongoose";
import Notification from "@/lib/models/Notification";
import { getTokenFromRequest, verifyToken } from "@/lib/utils/jwt";
import { ok, unauthorized, error } from "@/lib/utils/apiResponse";

// Bell dropdown source. Returns active notifications targeted to the
// caller's role (or "all"). Auth-gated so anonymous visitors don't see
// internal announcements.
export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload) return unauthorized();

    await connectDB();
    const role = payload.role || (Array.isArray(payload.roles) ? payload.roles[0] : "all");

    const items = await Notification.find({
      active: true,
      audience: { $in: ["all", role] },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return ok({
      notifications: items.map(n => ({
        id: n._id,
        title: n.title,
        body: n.body,
        href: n.href,
        createdAt: n.createdAt,
      })),
    });
  } catch (err) {
    console.error("GET /api/notifications error:", err);
    return error("Server error", 500);
  }
}
