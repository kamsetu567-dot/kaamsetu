import { connectDB } from "@/lib/db/mongoose";
import Payment from "@/lib/models/Payment";
import { verifyWebhookSignature } from "@/lib/utils/razorpay";
import { activatePayment } from "@/lib/utils/activatePayment";
import { ok, error } from "@/lib/utils/apiResponse";

// Razorpay server-to-server webhook. This is the SOURCE OF TRUTH for payment
// confirmation — it fires directly from Razorpay to us and doesn't depend on
// the buyer's browser, so a payment activates even if the user closed the tab
// the instant they paid. The client verify route is the fast happy path; this
// is the safety net. Both call the same idempotent activatePayment(), so if
// both fire, the effect is applied exactly once.
//
// Configure in the Razorpay dashboard: Webhooks → add
//   https://<your-domain>/api/payments/webhook
// subscribe to the "payment.captured" event, and set RAZORPAY_WEBHOOK_SECRET
// in env to the secret Razorpay shows you.
//
// IMPORTANT: we verify the signature against the RAW request body. Do not parse
// to JSON before verifying — the bytes must match exactly what Razorpay signed.
export async function POST(request) {
  try {
    const raw = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!verifyWebhookSignature(raw, signature)) {
      // Either not configured, or a forged/replayed request. 400 so Razorpay
      // marks it failed (and retries) rather than assuming success.
      return error("Invalid webhook signature", 400);
    }

    let event;
    try { event = JSON.parse(raw); } catch { return error("Invalid payload", 400); }

    // We only act on a captured payment. Other events are acknowledged (200) so
    // Razorpay doesn't retry them.
    if (event?.event !== "payment.captured") {
      return ok({ ignored: true, event: event?.event || null });
    }

    const entity = event?.payload?.payment?.entity || {};
    const orderId = entity.order_id;
    const paymentId = entity.id;
    if (!orderId) return ok({ ignored: true, reason: "no order_id" });

    await connectDB();
    const payment = await Payment.findOne({ razorpayOrderId: orderId });
    if (!payment) {
      // Ack so Razorpay stops retrying — we simply have no matching order.
      return ok({ ignored: true, reason: "order not found" });
    }

    if (payment.status === "paid") {
      return ok({ alreadyProcessed: true });
    }

    if (paymentId && !payment.razorpayPaymentId) payment.razorpayPaymentId = paymentId;
    const result = await activatePayment(payment);

    return ok({ processed: true, purpose: result.purpose });
  } catch (err) {
    console.error("POST /api/payments/webhook error:", err);
    // 500 → Razorpay will retry, which is what we want on a transient failure.
    return error("Webhook processing error", 500);
  }
}
