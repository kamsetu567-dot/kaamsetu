import { connectDB } from "@/lib/db/mongoose";
import Payment from "@/lib/models/Payment";
import { getTokenFromRequest, verifyToken } from "@/lib/utils/jwt";
import { buildPaymentDraft } from "@/lib/utils/paymentPricing";
import { ok, created, error, unauthorized } from "@/lib/utils/apiResponse";

// Manual UPI-QR payment claim. The payer scans the admin QR, pays, and submits a
// screenshot as proof. We record a Payment as "pending_review"; an admin approves
// it in the admin panel (→ activatePayment, same as a real payment) or rejects it.
//
// The amount/purpose are priced server-side via buildPaymentDraft — the exact
// same logic as the Razorpay create-order route — so the client can't set a price.

export async function POST(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload) return unauthorized();

    const body = await request.json().catch(() => ({}));
    const purpose = body.purpose === "ad" ? "ad" : "subscription";

    const screenshotUrl = typeof body.screenshotUrl === "string" ? body.screenshotUrl.trim() : "";
    if (!screenshotUrl) return error("Payment screenshot is required", 400);
    // Screenshots are compressed client-side (compressImage) to an inline base64
    // data URL — the same image transport the rest of the app uses. Accept that
    // or a plain http(s) URL, and cap the size to keep the request sane.
    const isDataImg = /^data:image\/(png|jpe?g|webp);base64,/i.test(screenshotUrl);
    const isHttp = /^https?:\/\//i.test(screenshotUrl);
    if (!isDataImg && !isHttp) return error("Invalid screenshot image", 400);
    if (screenshotUrl.length > 8 * 1024 * 1024) return error("Screenshot too large", 413);

    await connectDB();

    // Resolves the payer, validates, and prices the claim (role-guarded inside).
    const draft = await buildPaymentDraft(purpose, payload, body);
    if (!draft.ok) return error(draft.message, draft.status);
    const { amount, meta, workerRef, shopRef } = draft;

    // One pending claim at a time per user+purpose — stops a payer flooding the
    // admin queue with duplicates while one is already awaiting review.
    const existingPending = await Payment.findOne({
      user: payload.id,
      purpose,
      status: "pending_review",
      method: "manual_qr",
    }).lean();
    if (existingPending) {
      return error("You already have a payment awaiting admin approval.", 409);
    }

    const paymentDoc = await Payment.create({
      user: payload.id,
      purpose,
      amount,
      currency: "INR",
      method: "manual_qr",
      status: "pending_review",
      screenshotUrl,
      worker: workerRef,
      shop: shopRef,
      meta,
    });

    return created({
      message: "Payment submitted. It will be activated after admin approval.",
      paymentId: String(paymentDoc._id),
      status: "pending_review",
      purpose,
      amount,
    });
  } catch (err) {
    console.error("POST /api/payments/manual error:", err);
    return error("Server error", 500);
  }
}

// Latest manual claim for the caller (per purpose) so the UI can show
// "waiting for approval" / "rejected" states.
export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload) return unauthorized();

    const { searchParams } = new URL(request.url);
    const purpose = searchParams.get("purpose") === "ad" ? "ad" : "subscription";

    await connectDB();
    const latest = await Payment.findOne({
      user: payload.id,
      purpose,
      method: "manual_qr",
    }).sort({ createdAt: -1 }).lean();

    if (!latest) return ok({ payment: null });
    return ok({
      payment: {
        id: String(latest._id),
        status: latest.status,
        amount: latest.amount,
        purpose: latest.purpose,
        rejectReason: latest.rejectReason || "",
        createdAt: latest.createdAt,
        reviewedAt: latest.reviewedAt || null,
      },
    });
  } catch (err) {
    console.error("GET /api/payments/manual error:", err);
    return error("Server error", 500);
  }
}
