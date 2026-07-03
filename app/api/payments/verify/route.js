import { connectDB } from "@/lib/db/mongoose";
import Payment from "@/lib/models/Payment";
import { getTokenFromRequest, verifyToken } from "@/lib/utils/jwt";
import { verifySignature } from "@/lib/utils/razorpay";
import { activatePayment } from "@/lib/utils/activatePayment";
import { ok, error, unauthorized, notFound } from "@/lib/utils/apiResponse";

export async function POST(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload) return unauthorized();

    const body = await request.json().catch(() => ({}));
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return error("razorpayOrderId, razorpayPaymentId and razorpaySignature are required", 400);
    }

    await connectDB();

    // Look the order up by our own record — the amount/purpose/refs come from
    // the server, so the client can't lie about what was paid for.
    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) return notFound("Payment order not found");
    if (String(payment.user) !== String(payload.id)) {
      return unauthorized("This payment does not belong to you");
    }

    // Idempotent: a repeated verify (double-submit, retry, or webhook already
    // applied it) must not re-apply.
    if (payment.status === "paid") {
      return ok({ message: "Payment already verified", purpose: payment.purpose, alreadyProcessed: true });
    }

    // Constant-time HMAC check.
    if (!verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      payment.status = "failed";
      await payment.save();
      return error("Payment signature verification failed", 400);
    }

    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;

    const result = await activatePayment(payment);
    if (result.error === "worker_not_found") return notFound("Worker not found");

    return ok(
      result.purpose === "subscription"
        ? { message: "Subscription activated", purpose: "subscription", expiresAt: result.expiresAt }
        : { message: "Payment received. Ad submitted for review.", purpose: "ad", adId: result.adId }
    );
  } catch (err) {
    console.error("POST /api/payments/verify error:", err);
    return error("Server error", 500);
  }
}
