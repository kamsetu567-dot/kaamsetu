import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/models/User";
import { getTokenFromRequest, verifyToken } from "@/lib/utils/jwt";
import { ok, unauthorized, error } from "@/lib/utils/apiResponse";
import { isRealUserId } from "../shared";

// Marks every notification read for the caller by stamping a high-water mark.
// Fired when the user opens the bell (or the Alerts tab). Idempotent.
export async function POST(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload) return unauthorized();

    // Admin has no User row (id: "admin") and no bell — no-op rather than 500.
    if (!isRealUserId(payload.id)) return ok({ unreadCount: 0 });

    await connectDB();
    await User.updateOne(
      { _id: payload.id },
      { $set: { notificationsSeenAt: new Date() } }
    );

    return ok({ unreadCount: 0 });
  } catch (err) {
    console.error("POST /api/notifications/read error:", err);
    return error("Server error", 500);
  }
}
