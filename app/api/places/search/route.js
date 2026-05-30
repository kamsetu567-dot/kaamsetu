import { mapplsSearch } from "@/lib/utils/mappls";
import { ok, error } from "@/lib/utils/apiResponse";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    if (q.length < 3) return ok({ results: [] });
    const results = await mapplsSearch(q);
    return ok({ results });
  } catch (err) {
    console.error("GET /api/places/search error:", err);
    return error("Search failed", 500);
  }
}
