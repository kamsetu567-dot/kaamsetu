import { connectDB } from "@/lib/db/mongoose";
import Payment from "@/lib/models/Payment";
import { getTokenFromRequest, verifyToken } from "@/lib/utils/jwt";
import { activatePayment } from "@/lib/utils/activatePayment";
import { ok, error, unauthorized, notFound } from "@/lib/utils/apiResponse";

// Admin approves or rejects a manual-QR payment claim.
// - approve → activatePayment (extends subscription / creates the pending Ad) and
//   flips the row to "paid". Same activation a real Razorpay payment would run.
// - reject  → marks the row "rejected" with a reason; nothing is granted.
export async function PATCH(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") return unauthorized();

    const { id } = await params;
    const { action, reason } = await request.json().catch(() => ({}));

    await connectDB();
    const payment = await Payment.findById(id);
    if (!payment) return notFound("Payment not found");
    if (payment.method !== "manual_qr") return error("Not a manual payment", 400);
    if (payment.status !== "pending_review") {
      return error(`Payment is already ${payment.status}`, 409);
    }

    if (action === "approve") {
      // activatePayment flips status → "paid" and applies the effect. It's
      // idempotent (short-circuits if already "paid"), so a double-approve is safe.
      const result = await activatePayment(payment);
      if (result.error === "worker_not_found") return notFound("Worker not found");
      payment.reviewedBy = payload.username || "admin";
      payment.reviewedAt = new Date();
      await payment.save();
      return ok({
        message: "Payment approved & activated",
        status: "paid",
        purpose: payment.purpose,
        ...(result.expiresAt ? { expiresAt: result.expiresAt } : {}),
        ...(result.adId ? { adId: result.adId } : {}),
      });
    }

    if (action === "reject") {
      payment.status = "rejected";
      payment.rejectReason = (typeof reason === "string" ? reason : "").slice(0, 300);
      payment.reviewedBy = payload.username || "admin";
      payment.reviewedAt = new Date();
      await payment.save();
      return ok({ message: "Payment rejected", status: "rejected" });
    }

    return error("Invalid action");
  } catch (err) {
    console.error("admin PATCH payment error:", err);
    return error("Server error", 500);
  }
}
