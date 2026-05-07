import { apiPost, apiGet } from "./client";

export async function createSubscription(workerId, plan = "monthly") {
  return apiPost("/api/payments/create-order", { plan });
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

export async function createAdPayment(shopId, adData) {
  return apiPost("/api/payments/create-order", { type: "ad", shopId, ...adData });
}
