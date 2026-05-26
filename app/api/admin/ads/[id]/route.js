import { connectDB } from "@/lib/db/mongoose";
import Ad from "@/lib/models/Ad";
import { getTokenFromRequest, verifyToken } from "@/lib/utils/jwt";
import { ok, error, unauthorized, notFound } from "@/lib/utils/apiResponse";

function adminGuard(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.role === "admin" ? payload : null;
}

export async function PATCH(request, { params }) {
  try {
    if (!adminGuard(request)) return unauthorized();

    const { id } = await params;
    const body = await request.json();
    const { action, reviewNote } = body; // action: "approve" | "reject"

    if (!["approve", "reject"].includes(action)) {
      return error("action must be 'approve' or 'reject'", 400);
    }

    await connectDB();
    const ad = await Ad.findById(id);
    if (!ad) return notFound("Ad not found");

    if (action === "approve") {
      const now = new Date();
      ad.status = "active";
      ad.startsAt = now;
      ad.expiresAt = new Date(now.getTime() + ad.duration * 24 * 60 * 60 * 1000);
      ad.reviewNote = null;
    } else {
      ad.status = "rejected";
      ad.reviewNote = reviewNote || "Ad does not meet our guidelines.";
    }

    await ad.save();
    return ok({ ad: { ...ad.toObject(), id: ad._id } });
  } catch (err) {
    console.error("PATCH /api/admin/ads/[id] error:", err);
    return error("Server error", 500);
  }
}
