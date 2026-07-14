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

// ── Strict matching, for job routing ────────────────────────────────────
// The loose `cityRegex` above is right for the workers SEARCH page (typing
// "Delhi" should surface "New Delhi"). It is wrong for deciding who may see a
// job: a substring match would leak a "Jind" job to a "Jindpur" worker. Job
// visibility uses the anchored matcher below instead.

export function normalizeCity(city) {
  return String(city ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

// Values that occupy the city field but carry no routing information. A job
// whose city is one of these can't be shown to anyone, so callers must treat
// them as "no city" rather than matching on the literal text.
const PLACEHOLDER_CITIES = new Set(["", "unknown", "n/a", "na", "-", "null", "undefined"]);

export function isUsableCity(city) {
  return !PLACEHOLDER_CITIES.has(normalizeCity(city));
}

// Anchored, case-insensitive, whitespace-tolerant EXACT city match.
//   "Jind" === "jind" === "Jind "   but NOT "Jindpur", NOT "New Jind"
// The ^\s*…\s*$ wrapper matters: live data contains both "Jind" and
// "Muzaffarnagar " (trailing space), and the padding has to be tolerated on the
// stored side as well as the query side.
//
// Returns null for blank/placeholder input so callers can FAIL CLOSED (show no
// jobs) rather than silently dropping the filter and leaking every job.
export function exactCityRegex(city) {
  const trimmed = String(city ?? "").trim();
  if (!isUsableCity(trimmed)) return null;
  return { $regex: `^\\s*${escapeRegex(trimmed)}\\s*$`, $options: "i" };
}
