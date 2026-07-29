import { connectDB } from "@/lib/db/mongoose";
import Payment from "@/lib/models/Payment";
import { getTokenFromRequest, verifyToken } from "@/lib/utils/jwt";
import { getRazorpay, isRazorpayConfigured } from "@/lib/utils/razorpay";
import { buildPaymentDraft } from "@/lib/utils/paymentPricing";
import { created, error, unauthorized } from "@/lib/utils/apiResponse";

export async function POST(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload) return unauthorized();

    if (!isRazorpayConfigured()) {
      return error("Payment gateway not configured. Contact support.", 503);
    }
    const razorpay = getRazorpay();
    if (!razorpay) return error("Payment gateway not configured. Contact support.", 503);

    const body = await request.json().catch(() => ({}));
    const purpose = body.purpose === "ad" ? "ad" : "subscription";

    await connectDB();

    // Price + validate the order server-side (shared with the manual-QR route).
    // `amount` is always computed here (rupees); paise = amount * 100.
    const draft = await buildPaymentDraft(purpose, payload, body);
    if (!draft.ok) return error(draft.message, draft.status);
    const { amount, meta, workerRef, shopRef } = draft;

    // Create the Razorpay order (amount in paise).
    let order;
    try {
      order = await razorpay.orders.create({
        amount: amount * 100,
        currency: "INR",
        // Razorpay caps receipt at 40 chars. purpose(≤12) + "_" + timestamp(13)
        // stays well under; the full user id lives in notes instead.
        receipt: `${purpose.slice(0, 12)}_${Date.now()}`,
        notes: { purpose, userId: String(payload.id) },
      });
    } catch (rzErr) {
      // Log Razorpay's actual reason server-side. The SDK wraps errors under
      // rzErr.error (Razorpay's body) with .description/.code, plus .statusCode.
      const detail =
        rzErr?.error?.description ||
        rzErr?.description ||
        rzErr?.message ||
        (typeof rzErr === "object" ? JSON.stringify(rzErr) : String(rzErr));
      const rzStatus = rzErr?.statusCode || rzErr?.error?.code || rzErr?.status || "";
      console.error("razorpay order create failed:", rzStatus, detail);
      const isAuth = String(rzStatus) === "401" || /authentication|key|unauthor/i.test(detail);
      return error(
        isAuth
          ? "Payment gateway keys are invalid. Please contact support."
          : "Could not start payment. Please try again.",
        502
      );
    }

    const paymentDoc = await Payment.create({
      user: payload.id,
      purpose,
      amount,
      currency: "INR",
      razorpayOrderId: order.id,
      status: "created",
      worker: workerRef,
      shop: shopRef,
      meta,
    });

    return created({
      orderId: order.id,
      amount,               // rupees, for display
      amountPaise: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      paymentDbId: String(paymentDoc._id),
      purpose,
    });
  } catch (err) {
    console.error("POST /api/payments/create-order error:", err);
    return error("Server error", 500);
  }
}
