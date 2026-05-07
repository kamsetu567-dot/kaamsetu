import { apiGet, apiPost, apiPatch } from "./client";

export async function createJobRequest(data) {
  try {
    return await apiPost("/api/jobs", data);
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function getIncomingJobs(workerId) {
  try {
    const data = await apiGet("/api/jobs", { workerId, status: "pending" });
    return data.jobs || [];
  } catch {
    return [];
  }
}

export async function getJobHistory(workerId) {
  try {
    const data = await apiGet("/api/jobs", { workerId });
    return data.jobs || [];
  } catch {
    return [];
  }
}

export async function acceptJob(jobId) {
  try {
    return await apiPost(`/api/jobs/${jobId}/accept`);
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function rejectJob(jobId) {
  try {
    return await apiPost(`/api/jobs/${jobId}/reject`);
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function getAllJobs(filters = {}) {
  try {
    const data = await apiGet("/api/jobs", filters);
    return data.jobs || [];
  } catch {
    return [];
  }
}

export async function getPendingRequests() {
  try {
    const data = await apiGet("/api/admin/pending-requests");
    return data.requests || [];
  } catch {
    return [];
  }
}

export async function markRequestCalled(requestId) {
  try {
    return await apiPatch("/api/admin/pending-requests", { requestId, action: "called" });
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function markRequestResolved(requestId) {
  try {
    return await apiPatch("/api/admin/pending-requests", { requestId, action: "resolved" });
  } catch (err) {
    return { success: false, message: err.message };
  }
}
