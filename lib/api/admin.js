// TODO: Replace with real API calls when backend is ready.

export async function getDashboardStats() {
  return {
    totalWorkers: 0,
    activeWorkers: 0,
    totalClients: 0,
    todayJobs: 0,
    totalCalls: 0,
    totalEarnings: 0,
    workingWorkers: 0,
    freeWorkers: 0,
  };
}

export async function getWorkerStatusCounts() {
  return { free: 0, working: 0 };
}

export async function getAllWorkers(filters = {}) {
  return [];
}

export async function getAllClients(filters = {}) {
  return [];
}

export async function approveWorker(workerId) {
  return { success: true };
}

export async function rejectWorker(workerId) {
  return { success: true };
}

export async function activateWorker(workerId) {
  return { success: true };
}

export async function deactivateWorker(workerId) {
  return { success: true };
}

export async function blockUser(userId, role) {
  return { success: true };
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
  return { visits: [], users: [], jobs: [], calls: [] };
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
