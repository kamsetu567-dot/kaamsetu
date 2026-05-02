// TODO: Replace with real API calls when backend is ready.

export async function createJobRequest(data) {
  return { success: true, jobId: null, message: "Request submitted. Worker will contact you soon." };
}

export async function getIncomingJobs(workerId) {
  return [];
}

export async function getJobHistory(workerId) {
  return [];
}

export async function acceptJob(jobId, workerId) {
  return { success: true, clientMobile: null };
}

export async function rejectJob(jobId, workerId) {
  return { success: true };
}

export async function getAllJobs(filters = {}) {
  return [];
}

export async function getPendingRequests() {
  return [];
}

export async function markRequestCalled(requestId) {
  return { success: true };
}

export async function markRequestResolved(requestId) {
  return { success: true };
}
