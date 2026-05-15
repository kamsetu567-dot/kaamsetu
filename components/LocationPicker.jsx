"use client";

import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

export default function LocationPicker({ value = "", onChange, error = "", placeholder = "शहर / एरिया (City / Area)" }) {
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoError("आपका browser location support नहीं करता / Browser doesn't support geolocation");
      return;
    }
    setLocating(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
        onChange(coords);
        setLocating(false);
      },
      () => {
        setGeoError("Location access denied / लोकेशन access नहीं मिली");
        setLocating(false);
      }
    );
  }

  return (
    <div>
      <div
        className={`flex items-center border-2 rounded-xl overflow-hidden bg-white transition-colors ${
          error ? "border-red-400" : "border-gray-200 focus-within:border-brand-navy"
        }`}
      >
        <MapPin size={20} className="ml-4 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-4 text-lg focus:outline-none bg-transparent"
          aria-label="Location"
        />
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="px-4 py-4 text-brand-navy font-semibold text-sm border-l-2 border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-1 whitespace-nowrap"
          aria-label="Use my current location"
        >
          {locating ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
          <span className="hidden sm:inline">मेरी लोकेशन / Use My Location</span>
          <span className="sm:hidden">My Location</span>
        </button>
      </div>
      {(error || geoError) && (
        <p className="text-red-500 text-sm mt-1">{error || geoError}</p>
      )}
    </div>
  );
}
