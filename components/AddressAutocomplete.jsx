"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2, X } from "lucide-react";

// Structured address picker backed by /api/places/search + /api/places/reverse.
// value: { address, locality, city, state, pincode, lat, lng } | null
export default function AddressAutocomplete({
  value,
  onChange,
  error = "",
  placeholder = "अपनी कॉलोनी, एरिया डालें / Type your area, colony or city",
  required = false,
}) {
  const [query, setQuery] = useState(value?.address || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");
  const wrapRef = useRef(null);
  const debounceRef = useRef(null);

  // Keep query in sync if parent resets value (e.g. GPS auto-fill)
  useEffect(() => {
    if (value?.address && value.address !== query) setQuery(value.address);
    // intentionally not depending on `query` — we only want to react to external changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.address]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function handleType(e) {
    const q = e.target.value;
    setQuery(q);
    setOpen(true);
    setGeoError("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(Array.isArray(data.results) ? data.results : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  async function pick(r) {
    // Show the picked address immediately so the UI feels responsive;
    // enrich with city/state/pincode in the background.
    setQuery(r.address);
    setOpen(false);
    setResults([]);
    onChange?.(r);
    try {
      const res = await fetch(`/api/places/geocode?address=${encodeURIComponent(r.address)}`);
      const data = await res.json();
      if (data?.result) {
        onChange?.({
          ...r,
          ...data.result,
          // Preserve coords if they were set (e.g. via reverse-geocode)
          lat: r.lat ?? data.result.lat ?? null,
          lng: r.lng ?? data.result.lng ?? null,
          address: data.result.address || r.address,
        });
      }
    } catch {
      // Enrichment is best-effort — the original suggestion is fine on its own.
    }
  }

  function clear() {
    onChange?.(null);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  async function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Browser doesn't support geolocation / लोकेशन support नहीं है");
      return;
    }
    setLocating(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const res = await fetch(`/api/places/reverse?lat=${lat}&lng=${lng}`);
          const data = await res.json();
          if (data?.result?.address) {
            pick(data.result);
          } else {
            // Reverse failed but coords are valid — keep them in state so distance
            // matching still works, but show a friendly label, not the raw numbers.
            const stored = {
              address: "📍 लोकेशन मिल गई / Location captured",
              locality: "",
              city: "",
              state: "",
              pincode: "",
              lat,
              lng,
            };
            onChange?.(stored);
            setQuery(stored.address);
            setOpen(false);
            setResults([]);
          }
        } catch {
          const stored = {
            address: "📍 लोकेशन मिल गई / Location captured",
            lat,
            lng,
          };
          onChange?.(stored);
          setQuery(stored.address);
          setOpen(false);
          setResults([]);
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setGeoError("Location access denied / लोकेशन access नहीं मिली");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <div
        className={`flex items-center border-2 rounded-xl overflow-hidden bg-white transition-colors ${
          error ? "border-red-400" : "border-gray-200 focus-within:border-brand-navy"
        }`}
      >
        <MapPin size={20} className="ml-4 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={handleType}
          onFocus={() => query.length >= 3 && setOpen(true)}
          placeholder={placeholder}
          required={required}
          aria-label="Location"
          className="flex-1 px-3 py-4 text-base focus:outline-none bg-transparent min-w-0"
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear"
            className="px-2 text-gray-400 hover:text-gray-600 min-h-0"
          >
            <X size={18} />
          </button>
        )}
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="px-3 py-4 text-brand-navy font-semibold text-sm border-l-2 border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-1 whitespace-nowrap"
          aria-label="Use my current location"
        >
          {locating ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
          <span className="hidden sm:inline">My Location</span>
        </button>
      </div>

      {open && (results.length > 0 || searching) && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
          {searching && (
            <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Searching…
            </div>
          )}
          {!searching && results.map((r, i) => (
            <button
              key={(r.placeId || "") + i}
              type="button"
              onClick={() => pick(r)}
              className="w-full text-left px-4 py-2.5 hover:bg-brand-yellow/10 border-b last:border-b-0 border-gray-100 min-h-0"
            >
              <p className="text-sm font-bold text-brand-navy line-clamp-1">
                {r.locality || r.address}
              </p>
              <p className="text-xs text-gray-500 line-clamp-1">
                {[r.city, r.state].filter(Boolean).join(", ")}
                {r.pincode ? ` — ${r.pincode}` : ""}
              </p>
            </button>
          ))}
        </div>
      )}

      {(error || geoError) && (
        <p className="text-red-500 text-sm mt-1">{error || geoError}</p>
      )}
    </div>
  );
}
