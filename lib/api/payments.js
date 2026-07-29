import { apiPost, apiGet } from "./client";

export async function createSubscription() {
  return apiPost("/api/payments/create-order", { purpose: "subscription", plan: "monthly" });
}

export async function verifyPayment(paymentData) {
  return apiPost("/api/payments/verify", paymentData);
}

export async function getSubscriptionStatus(workerId) {
  try {
    const data = await apiGet(`/api/workers/${workerId}`);
    const expiry = data.worker?.subscriptionExpiry;
    if (!expiry) return null;
    return {
      active: new Date(expiry) > new Date(),
      expiresAt: expiry,
    };
  } catch {
    return null;
  }
}

export async function createAdPayment(adData) {
  return apiPost("/api/payments/create-order", { purpose: "ad", ...adData });
}

// ---- Manual UPI-QR flow (used while the Razorpay gateway is hidden) ----

// Submit a payment claim with an uploaded screenshot. `payload` is
// { purpose: "subscription" } or { purpose: "ad", type, category, duration, creative },
// plus `screenshotUrl` (a base64 data URL from compressImage). Amount is priced
// server-side. Resolves to a pending_review record awaiting admin approval.
export async function submitManualPayment(payload) {
  return apiPost("/api/payments/manual", payload);
}

// The caller's latest manual claim for a purpose (or null) — drives the
// "waiting for approval" / "rejected" UI states.
export async function getMyManualPayment(purpose = "subscription") {
  try {
    const data = await apiGet("/api/payments/manual", { purpose });
    return data.payment || null;
  } catch {
    return null;
  }
}
