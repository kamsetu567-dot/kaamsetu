// Distance between two GeoJSON points, in kilometres.
//
// Used to ORDER the worker's job feed (nearest first) — never to filter it.
// Job visibility is gated on city alone; distance is presentation. Doing it in
// JS rather than with $geoNear is deliberate: $geoNear silently drops documents
// that have no coordinates, which would hide same-city jobs posted without GPS
// (most of them — the address autocomplete often returns no lat/lng).
//
// Inputs are GeoJSON-ordered: [lng, lat].
export function haversineKm([lng1, lat1], [lng2, lat2]) {
  const R = 6371; // mean earth radius, km
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

// Pulls [lng, lat] out of our Mixed `location.coordinates` field, which is
// either a GeoJSON Point or absent. Returns null when unusable.
export function coordsOf(location) {
  const c = location?.coordinates?.coordinates;
  return Array.isArray(c) && c.length === 2 && Number.isFinite(c[0]) && Number.isFinite(c[1])
    ? c
    : null;
}
