import { mapplsReverse } from "@/lib/utils/mappls";
import { ok, error } from "@/lib/utils/apiResponse";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat"));
    const lng = parseFloat(searchParams.get("lng"));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return error("lat and lng required", 400);
    }
    // India bounding box — reject obvious garbage (saves a Mappls call)
    if (lat < 6 || lat > 38 || lng < 68 || lng > 98) {
      return ok({ result: null });
    }
    const result = await mapplsReverse(lat, lng);
    return ok({ result });
  } catch (err) {
    console.error("GET /api/places/reverse error:", err);
    return error("Reverse geocode failed", 500);
  }
}
