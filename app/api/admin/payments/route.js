import { connectDB } from "@/lib/db/mongoose";
import Payment from "@/lib/models/Payment";
// Imported so the models are registered before .populate() runs on a cold start.
import Worker from "@/lib/models/Worker";
import Shop from "@/lib/models/Shop";
import User from "@/lib/models/User";
import { getTokenFromRequest, verifyToken } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";

function adminGuard(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.role === "admin" ? payload : null;
}

// Lists manual-QR payment claims for admin review. Defaults to the ones awaiting
// approval; ?status=all|paid|rejected to see history.
export async function GET(request) {
  try {
    if (!adminGuard(request)) return unauthorized();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending_review";
    const query = { method: "manual_qr" };
    if (status !== "all") query.status = status;

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("worker", "name mobile")
      .populate("shop", "shopName ownerName mobile")
      .populate("user", "name mobile")
      .lean();

    const items = payments.map((p) => {
      const isSub = p.purpose === "subscription";
      const payerName = isSub
        ? (p.worker?.name || p.user?.name || "Worker")
        : (p.shop?.shopName || p.user?.name || "Shop");
      const payerMobile = isSub
        ? (p.worker?.mobile || p.user?.mobile || "")
        : (p.shop?.mobile || p.user?.mobile || "");
      return {
        id: String(p._id),
        purpose: p.purpose,
        amount: p.amount,
        status: p.status,
        screenshotUrl: p.screenshotUrl || "",
        payerName,
        payerMobile,
        meta: p.meta || {},
        createdAt: p.createdAt,
        reviewedAt: p.reviewedAt || null,
        rejectReason: p.rejectReason || "",
      };
    });

    return ok({ payments: items });
  } catch (err) {
    console.error("GET /api/admin/payments error:", err);
    return error("Server error", 500);
  }
}
