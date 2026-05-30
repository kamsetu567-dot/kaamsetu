import { apiGet, apiPatch } from "./client";

export async function getWorkers(filters = {}) {
  try {
    const params = {
      query: filters.query,
      category: filters.category,
      subcategory: filters.subcategory,
      gender: Array.isArray(filters.gender) ? filters.gender.join(",") : filters.gender,
      serviceType: Array.isArray(filters.serviceType) ? filters.serviceType.join(",") : filters.serviceType,
      employmentType: filters.employmentType,
      experienceLevel: filters.experienceLevel,
      sortBy: filters.sortBy,
      rating: filters.rating,
      city: filters.city,
      // Geo distance: always send `distance` when set — server uses it for
      // $geoNear when coords are present, or for city-name fallback when not.
      lat: filters.lat,
      lng: filters.lng,
      distance: filters.distance,
    };
    const data = await apiGet("/api/workers", params);
    return data.workers || [];
  } catch {
    return [];
  }
}

export async function getWorkerById(id) {
  try {
    const data = await apiGet(`/api/workers/${id}`);
    return data.worker || null;
  } catch {
    return null;
  }
}

export async function updateWorker(id, updates) {
  return apiPatch(`/api/workers/${id}`, updates);
}

export async function updateWorkerStatus(workerId, workStatus) {
  return apiPatch("/api/workers/status", { workStatus });
}

export async function getWorkerSubscription(workerId) {
  try {
    const data = await apiGet(`/api/workers/${workerId}`);
    return data.worker?.subscriptionExpiry ? { expiresAt: data.worker.subscriptionExpiry } : null;
  } catch {
    return null;
  }
}

export async function boostWorkerRating(workerId) {
  return apiPatch(`/api/admin/workers/${workerId}`, { action: "boost" });
}
