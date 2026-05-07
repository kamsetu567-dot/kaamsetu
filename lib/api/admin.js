import { apiGet, apiPost, apiPatch } from "./client";

export async function getDashboardStats() {
  try {
    const data = await apiGet("/api/admin/stats");
    return data.stats || {
      totalWorkers: 0, activeWorkers: 0, totalClients: 0,
      todayJobs: 0, totalCalls: 0, totalEarnings: 0,
      workingWorkers: 0, freeWorkers: 0,
    };
  } catch {
    return {
      totalWorkers: 0, activeWorkers: 0, totalClients: 0,
      todayJobs: 0, totalCalls: 0, totalEarnings: 0,
      workingWorkers: 0, freeWorkers: 0,
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
  return apiPatch(`/api/admin/workers/${userId}`, { action: "block" });
}

export async function boostWorker(workerId) {
  return apiPatch(`/api/admin/workers/${workerId}`, { action: "boost" });
}

export async function extendWorkerSubscription(workerId) {
  return apiPatch(`/api/admin/workers/${workerId}`, { action: "extend" });
}

export async function getOffers() {
  return [];
}

export async function createOffer(data) {
  return { success: true };
}

export async function getPaymentSettings() {
  return { upiId: "", bankDetails: {}, qrCodeUrl: "" };
}

export async function updatePaymentSettings(data) {
  return { success: true };
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
  return { subscriptionPrice: 199, defaultRadius: 5, smsTemplates: {} };
}

export async function updateSettings(data) {
  return { success: true };
}

export async function broadcastNotification(data) {
  return { success: true };
}
