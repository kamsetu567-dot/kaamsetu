// Build a safe, forgiving regex for matching a city name against the
// `location.city` field. Most workers/clients/jobs have NO GPS coordinates
// (Mappls free tier returns no lat/lng for typed addresses), so this
// city-name match is the real safety net for "nearby" search.
//
// Why a helper instead of inline `{ $regex: city, $options: "i" }`:
//   - Trims surrounding whitespace ("Jaipur " vs "Jaipur").
//   - Escapes regex metacharacters so a typed value like "Jai(pur" can't
//     throw or mis-match — raw user input went straight into $regex before.
//   - Case-insensitive via the "i" flag.
//
// Returns null for empty/blank input so callers can skip adding the filter
// entirely (matching the previous `if (city) { ... }` behavior).

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function cityRegex(city) {
  const trimmed = (city || "").trim();
  if (!trimmed) return null;
  return { $regex: escapeRegex(trimmed), $options: "i" };
}
