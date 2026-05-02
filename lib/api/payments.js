// TODO: Replace with real API calls when backend is ready.

export async function createSubscription(workerId, plan) {
  return { success: true, subscriptionId: null, amount: 199 };
}

export async function verifyPayment(paymentData) {
  return { success: true };
}

export async function getSubscriptionStatus(workerId) {
  return null;
}

export async function createAdPayment(shopId, adData) {
  return { success: true, amount: adData.budget };
}
