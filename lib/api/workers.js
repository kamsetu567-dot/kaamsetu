// TODO: Replace with real API calls when backend is ready.

export async function getWorkers(filters = {}) {
  return [];
}

export async function getWorkerById(id) {
  return null;
}

export async function updateWorker(id, data) {
  return { success: true };
}

export async function updateWorkerStatus(workerId, status) {
  // status: "free" | "working"
  return { success: true, status };
}

export async function getWorkerSubscription(workerId) {
  return null;
}

export async function boostWorkerRating(workerId) {
  return { success: true };
}
