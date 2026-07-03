import crypto from "crypto";
import Razorpay from "razorpay";

// Server-side Razorpay client. Keys live in env only — never hardcoded, never
// shipped to the browser. RAZORPAY_KEY_ID is also the public checkout key
// (mirrored as NEXT_PUBLIC_RAZORPAY_KEY_ID for the client), but the SECRET is
// server-only and signs/verifies payments here.
//
// Lazy singleton (same pattern as lib/utils/mappls.js): build the client on
// first use so a missing key doesn't crash module import — the route layer
// turns a null client into a clean 503.

let cached = null;

export function isRazorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function getRazorpay() {
  if (cached) return cached;
  if (!isRazorpayConfigured()) {
    console.warn("[razorpay] RAZORPAY_KEY_ID/SECRET not set");
    return null;
  }
  cached = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  return cached;
}

// Verify a checkout success signature. Razorpay signs `${orderId}|${paymentId}`
// with HMAC-SHA256 using the key secret; we recompute and compare in constant
// time. Returns false on any missing input or mismatch — never throws.
export function verifySignature(orderId, paymentId, signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !orderId || !paymentId || !signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(String(signature), "utf8");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
