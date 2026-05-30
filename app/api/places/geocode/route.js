import { mapplsGeocode } from "@/lib/utils/mappls";
import { ok, error } from "@/lib/utils/apiResponse";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = (searchParams.get("address") || "").trim();
    if (address.length < 3) return ok({ result: null });
    const result = await mapplsGeocode(address);
    return ok({ result });
  } catch (err) {
    console.error("GET /api/places/geocode error:", err);
    return error("Geocode failed", 500);
  }
}
