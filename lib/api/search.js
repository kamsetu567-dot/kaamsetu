import { apiPost, apiGet } from "./client";

export async function search(query, filters = {}) {
  try {
    const data = await apiGet("/api/workers", { query, ...filters });
    return data.workers || [];
  } catch {
    return [];
  }
}

export async function getTrendingSearches() {
  return [];
}

export async function saveSearchRequest(query, contactInfo = {}) {
  try {
    return await apiPost("/api/jobs", {
      clientMobile: contactInfo.mobile,
      clientName: contactInfo.name,
      category: query,
      description: `Search request: ${query}`,
      source: "search",
    });
  } catch (err) {
    return { success: false, message: err.message };
  }
}
