// Server-side Mappls (MapMyIndia) client.
// OAuth client-credentials → bearer token → places search / geocode / reverse-geocode.
// All Mappls calls go through here so the ClientId/Secret never reach the browser.
//
// Field availability notes (verified against the free tier, May 2026):
// - `/api/places/search/json` → autocomplete-style suggestions.
//     Returns `placeName`, `placeAddress`, `eLoc`, `type`. NO lat/lng.
// - `/api/places/geocode` → text address → structured parts.
//     Returns `city`, `state`, `pincode`, `locality`, `formattedAddress`, `eLoc`.
//     NO lat/lng on the free tier.
// - `/advancedmaps/v1/<id>/rev_geocode` → coords → structured address.
//     Used when we already have device GPS.
//
// Practical consequence: lat/lng for typed addresses comes from device GPS (the
// "Use my location" button) or is left null and the city/locality fallback
// handles matching. eLoc is preserved for future Mappls routing/distance calls.

import { stripDistrictSuffix } from "./cityMatch";

const TOKEN_URL = "https://outpost.mappls.com/api/security/oauth/token";
const SEARCH_URL = "https://atlas.mapmyindia.com/api/places/search/json";
const GEOCODE_URL = "https://atlas.mapmyindia.com/api/places/geocode";
const REVERSE_URL_BASE = "https://apis.mappls.com/advancedmaps/v1";

let cached = null; // { token, expiresAt }

async function getMapplsToken() {
  const now = Date.now();
  if (cached && cached.expiresAt > now + 60_000) return cached.token;

  const clientId = process.env.MAPMYINDIA_CLIENT_ID;
  const clientSecret = process.env.MAPMYINDIA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.warn("[mappls] MAPMYINDIA_CLIENT_ID/SECRET not set");
    return null;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    console.warn("[mappls] token fetch failed", res.status);
    return null;
  }
  const data = await res.json();
  cached = {
    token: data.access_token,
    expiresAt: now + (data.expires_in || 3600) * 1000,
  };
  console.log("[mappls] token fetched");
  return cached.token;
}

// Pull whatever structured fields are usable from a search suggestion.
// search/json returns placeAddress as a comma-joined string — we keep it
// as `address` and let the pick handler call geocode for proper parts.
function normalizeSuggestion(s) {
  return {
    placeId: s.eLoc || null,
    address: s.placeAddress || "",
    locality: s.placeName || "",
    city: "",
    state: "",
    pincode: "",
    lat: null,
    lng: null,
  };
}

export async function mapplsSearch(query, { count = 8 } = {}) {
  const q = (query || "").trim();
  if (q.length < 3) return [];
  const token = await getMapplsToken();
  if (!token) return [];
  const url =
    SEARCH_URL +
    "?query=" + encodeURIComponent(q) +
    "&region=IND&itemCount=" + count;
  try {
    const res = await fetch(url, { headers: { Authorization: `bearer ${token}` } });
    if (!res.ok) {
      console.warn("[mappls] search failed", res.status);
      return [];
    }
    const data = await res.json();
    const list = data.suggestedLocations || data.results || [];
    return list.map(normalizeSuggestion).filter(r => r.address);
  } catch (err) {
    console.warn("[mappls] search error", err.message);
    return [];
  }
}

// Resolve a typed/picked address to structured parts (city, state, locality,
// pincode, eLoc). No coords returned — that's a Mappls free-tier limitation.
export async function mapplsGeocode(address) {
  const addr = (address || "").trim();
  if (addr.length < 3) return null;
  const token = await getMapplsToken();
  if (!token) return null;
  const url = GEOCODE_URL + "?address=" + encodeURIComponent(addr);
  try {
    const res = await fetch(url, { headers: { Authorization: `bearer ${token}` } });
    if (!res.ok) return null;
    const data = await res.json();
    const r = data.copResults || (data.results && data.results[0]) || null;
    if (!r) return null;
    return {
      placeId: r.eLoc || null,
      address: r.formattedAddress || addr,
      locality: r.subLocality || r.locality || r.subDistrict || "",
      // Normalize at capture: the API omits `city` for rural addresses, so the
      // district fallback would otherwise store "Muzaffarnagar District" where
      // an urban address stores "Muzaffarnagar" — two names for one place, and
      // job↔worker city matching is exact.
      city: stripDistrictSuffix(r.city || r.district || ""),
      state: r.state || "",
      pincode: r.pincode || "",
      lat: null,
      lng: null,
    };
  } catch (err) {
    console.warn("[mappls] geocode error", err.message);
    return null;
  }
}

export async function mapplsReverse(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const token = await getMapplsToken();
  if (!token) return null;
  const clientId = process.env.MAPMYINDIA_CLIENT_ID;
  const url = `${REVERSE_URL_BASE}/${clientId}/rev_geocode?lat=${lat}&lng=${lng}`;
  try {
    const res = await fetch(url, { headers: { Authorization: `bearer ${token}` } });
    if (!res.ok) {
      console.warn("[mappls] reverse failed", res.status);
      return null;
    }
    const data = await res.json();
    const r = (data.results && data.results[0]) || null;
    if (!r) return null;
    return {
      placeId: r.eLoc || null,
      address: r.formatted_address || [r.house_name, r.street, r.subSubLocality, r.subLocality, r.locality, r.city]
        .filter(Boolean).join(", "),
      locality: r.subLocality || r.locality || "",
      // Normalize at capture: the API omits `city` for rural addresses, so the
      // district fallback would otherwise store "Muzaffarnagar District" where
      // an urban address stores "Muzaffarnagar" — two names for one place, and
      // job↔worker city matching is exact.
      city: stripDistrictSuffix(r.city || r.district || ""),
      state: r.state || "",
      pincode: r.pincode || "",
      lat,
      lng,
    };
  } catch (err) {
    console.warn("[mappls] reverse error", err.message);
    return null;
  }
}
