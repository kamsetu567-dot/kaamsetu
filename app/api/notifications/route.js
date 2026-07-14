import { connectDB } from "@/lib/db/mongoose";
import Notification from "@/lib/models/Notification";
import User from "@/lib/models/User";
import { getTokenFromRequest, verifyToken } from "@/lib/utils/jwt";
import { ok, unauthorized, error } from "@/lib/utils/apiResponse";
import { audienceForRoles, isRealUserId } from "./shared";

// Bell dropdown source. Returns active notifications targeted to the caller's
// role(s) (or "all"), plus an `unreadCount` derived from the user's
// `notificationsSeenAt` high-water mark. Auth-gated so anonymous visitors don't
// see internal announcements.
export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload) return unauthorized();

    await connectDB();

    const audience = audienceForRoles(payload);
    const base = { active: true, audience };

    // The admin token carries id: "admin" (a string, not an ObjectId) — a
    // findById on it throws a CastError. Admins have no bell anyway.
    const user = isRealUserId(payload.id)
      ? await User.findById(payload.id).select("notificationsSeenAt").lean()
      : null;
    const seenAt = user?.notificationsSeenAt || null;

    const items = await Notification.find(base)
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Counted server-side rather than derived from `items`: the list is capped
    // at 10, so a client-side count could never exceed 10.
    const unreadCount = await Notification.countDocuments(
      seenAt ? { ...base, createdAt: { $gt: seenAt } } : base
    );

    return ok({
      notifications: items.map(n => ({
        id: n._id,
        title: n.title,
        body: n.body,
        href: n.href,
        createdAt: n.createdAt,
        unread: seenAt ? n.createdAt > seenAt : true,
      })),
      unreadCount,
    });
  } catch (err) {
    console.error("GET /api/notifications error:", err);
    return error("Server error", 500);
  }
}
