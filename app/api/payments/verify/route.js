import { connectDB } from "@/lib/db/mongoose";
import Worker from "@/lib/models/Worker";
import Ad from "@/lib/models/Ad";
import Payment from "@/lib/models/Payment";
import { getTokenFromRequest, verifyToken } from "@/lib/utils/jwt";
import { verifySignature } from "@/lib/utils/razorpay";
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

    // Idempotent: a repeated verify (double-submit, retry) must not re-apply.
    if (payment.status === "paid") {
      return ok({ message: "Payment already verified", purpose: payment.purpose, alreadyProcessed: true });
    }

    // Constant-time HMAC check.
    if (!verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      payment.status = "failed";
      await payment.save();
      return error("Payment signature verification failed", 400);
    }

    payment.status = "paid";
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;

    if (payment.purpose === "subscription") {
      // Extend subscription using the same "stack on future expiry" rule the
      // admin extend action uses (app/api/admin/workers/[id]/route.js).
      const days = Number(payment.meta?.days) > 0 ? Math.floor(Number(payment.meta.days)) : 30;
      const worker = await Worker.findById(payment.worker);
      if (!worker) { await payment.save(); return notFound("Worker not found"); }
      const now = new Date();
      const base = worker.subscriptionExpiry && worker.subscriptionExpiry > now
        ? worker.subscriptionExpiry
        : now;
      const newExpiry = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
      await Worker.findByIdAndUpdate(worker._id, { subscriptionExpiry: newExpiry });
      await payment.save();
      return ok({ message: "Subscription activated", purpose: "subscription", expiresAt: newExpiry });
    }

    // purpose === "ad": create the ad now that payment is confirmed. It still
    // starts as "pending" so admin reviews the creative before it goes live.
    const m = payment.meta || {};
    const ad = await Ad.create({
      shop: payment.shop,
      shopUser: payment.user,
      type: m.type || "banner",
      category: m.category,
      duration: m.duration,
      budget: payment.amount,
      creative: m.creative || null,
      status: "pending",
    });
    payment.ad = ad._id;
    await payment.save();
    return ok({ message: "Payment received. Ad submitted for review.", purpose: "ad", adId: String(ad._id) });
  } catch (err) {
    console.error("POST /api/payments/verify error:", err);
    return error("Server error", 500);
  }
}
