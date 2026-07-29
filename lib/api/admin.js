import { apiGet, apiPost, apiPatch, apiFetch } from "./client";

export async function getDashboardStats() {
  try {
    const data = await apiGet("/api/admin/stats");
    return data.stats || {
      totalWorkers: 0, activeWorkers: 0, totalClients: 0,
      todayJobs: 0, totalCalls: 0, totalEarnings: 0,
      workingWorkers: 0, freeWorkers: 0, pendingReports: 0,
    };
  } catch {
    return {
      totalWorkers: 0, activeWorkers: 0, totalClients: 0,
      todayJobs: 0, totalCalls: 0, totalEarnings: 0,
      workingWorkers: 0, freeWorkers: 0, pendingReports: 0,
    };
  }
}

export async function getWorkerStatusCounts() {
  try {
    const stats = await getDashboardStats();
    return { free: stats.freeWorkers, working: stats.workingWorkers };
  } catch {
    return { free: 0, working: 0 };
  }
}

export async function getAllWorkers(filters = {}) {
  try {
    const data = await apiGet("/api/admin/workers", filters);
    return data.workers || [];
  } catch {
    return [];
  }
}

export async function getAllClients(filters = {}) {
  try {
    const data = await apiGet("/api/admin/clients", filters);
    return data.clients || [];
  } catch {
    return [];
  }
}

// Mints a session for the given account so the admin can use the site as them.
// Deliberately NOT wrapped in a try/catch — unlike the list helpers above, a
// failure here must reach the caller: silently swallowing it would leave the
// admin's session half-swapped.
export async function impersonateAccount(type, id) {
  return apiPost("/api/admin/impersonate", { type, id });
}

export async function getAllJobs(filters = {}) {
  try {
    const data = await apiGet("/api/admin/jobs", filters);
    return data.jobs || [];
  } catch {
    return [];
  }
}

export async function approveWorker(workerId) {
  return apiPatch(`/api/admin/workers/${workerId}`, { action: "approve" });
}

export async function rejectWorker(workerId) {
  return apiPatch(`/api/admin/workers/${workerId}`, { action: "reject" });
}

export async function activateWorker(workerId) {
  return apiPatch(`/api/admin/workers/${workerId}`, { action: "activate" });
}

export async function deactivateWorker(workerId) {
  return apiPatch(`/api/admin/workers/${workerId}`, { action: "deactivate" });
}

export async function blockUser(userId, role) {
  const endpoint = role === "client" ? `/api/admin/clients/${userId}` : `/api/admin/workers/${userId}`;
  return apiPatch(endpoint, { action: "block" });
}

export async function unblockClient(clientId) {
  return apiPatch(`/api/admin/clients/${clientId}`, { action: "unblock" });
}

export async function deleteClient(clientId) {
  return apiPatch(`/api/admin/clients/${clientId}`, { action: "delete" });
}

export async function getAllShops(filters = {}) {
  try {
    const data = await apiGet("/api/admin/shops", filters);
    return data.shops || [];
  } catch {
    return [];
  }
}

export async function approveShop(shopId) {
  return apiPatch(`/api/admin/shops/${shopId}`, { action: "approve" });
}

export async function rejectShop(shopId) {
  return apiPatch(`/api/admin/shops/${shopId}`, { action: "reject" });
}

export async function blockShop(shopId) {
  return apiPatch(`/api/admin/shops/${shopId}`, { action: "block" });
}

export async function unblockShop(shopId) {
  return apiPatch(`/api/admin/shops/${shopId}`, { action: "unblock" });
}

export async function enableShopAd(shopId, adDays = 30) {
  return apiPatch(`/api/admin/shops/${shopId}`, { action: "enable_ad", adDays });
}

export async function disableShopAd(shopId) {
  return apiPatch(`/api/admin/shops/${shopId}`, { action: "disable_ad" });
}

export async function deleteShop(shopId) {
  return apiPatch(`/api/admin/shops/${shopId}`, { action: "delete" });
}

export async function boostWorker(workerId) {
  return apiPatch(`/api/admin/workers/${workerId}`, { action: "boost" });
}

export async function extendWorkerSubscription(workerId, days = 30) {
  return apiPatch(`/api/admin/workers/${workerId}`, { action: "extend", days });
}

export async function recomputeWorkerRating(workerId) {
  return apiPatch(`/api/admin/workers/${workerId}`, { action: "recompute_rating" });
}

export async function unblockWorker(workerId) {
  return apiPatch(`/api/admin/workers/${workerId}`, { action: "unblock" });
}

export async function deleteWorker(workerId) {
  return apiPatch(`/api/admin/workers/${workerId}`, { action: "delete" });
}


export async function getAnalytics(range) {
  try {
    const data = await apiGet("/api/admin/analytics", { range });
    return data.chartData || [];
  } catch {
    return [];
  }
}

export async function getSettings() {
  try {
    const data = await apiGet("/api/admin/settings");
    return data.settings || { subscriptionPrice: 199, defaultRadius: 5, smsTemplates: {} };
  } catch {
    return { subscriptionPrice: 199, defaultRadius: 5, smsTemplates: {} };
  }
}

export async function updateSettings(data) {
  return apiFetch("/api/admin/settings", { method: "PUT", body: data });
}

// ---- Manual UPI-QR payment review ----

// Pending manual payment claims awaiting admin approval (default), or history
// via status: "paid" | "rejected" | "all".
export async function getPendingPayments(status = "pending_review") {
  try {
    const data = await apiGet("/api/admin/payments", { status });
    return data.payments || [];
  } catch {
    return [];
  }
}

// Approve (→ activates the subscription/ad) or reject a manual payment claim.
export async function reviewPayment(id, action, reason = "") {
  return apiPatch(`/api/admin/payments/${id}`, { action, reason });
}

export async function broadcastNotification(data) {
  return apiPost("/api/admin/notifications/broadcast", data);
}
