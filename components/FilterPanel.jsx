"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useFilters } from "@/lib/context/FilterContext";
import CategorySelect from "./CategorySelect";

const DISTANCE_OPTIONS = [
  { value: 5, label: "5 km" },
  { value: 10, label: "10 km" },
  { value: 20, label: "20 km" },
];

const GENDER_OPTIONS = [
  { value: "male", hi: "पुरुष", en: "Male" },
  { value: "female", hi: "महिला", en: "Female" },
];

const SERVICE_TYPE_OPTIONS = [
  { value: "home_visit", hi: "घर पर आकर", en: "Home Visit" },
  { value: "shop_office", hi: "दुकान / ऑफिस पर", en: "Shop or Office" },
];

const SORT_OPTIONS = [
  { value: "rating", hi: "रेटिंग", en: "Rating" },
  { value: "distance", hi: "दूरी", en: "Distance" },
  { value: "newest", hi: "नयापन", en: "Newest" },
];

export default function FilterPanel({ className = "" }) {
  const { filters, updateFilter, resetFilters } = useFilters();
  const [open, setOpen] = useState(false);

  function toggleArray(key, value) {
    const arr = filters[key] || [];
    if (arr.includes(value)) {
      updateFilter(key, arr.filter(v => v !== value));
    } else {
      updateFilter(key, [...arr, value]);
    }
  }

  const panel = (
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <h4 className="font-bold text-text-primary mb-2">
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>क्रम</span>
          <span className="text-text-secondary font-normal"> / Sort By</span>
        </h4>
        <select
          value={filters.sortBy}
          onChange={e => updateFilter("sortBy", e.target.value)}
          className="w-full border-2 border-border-light rounded-xl px-4 py-3 text-base focus:outline-none focus:border-primary-orange"
          aria-label="Sort by"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.hi} / {o.en}</option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <h4 className="font-bold text-text-primary mb-2">
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>Category</span>
        </h4>
        <CategorySelect
          value={filters.category}
          onChange={v => updateFilter("category", v)}
          level="main"
        />
      </div>

      {/* Rating */}
      <div>
        <h4 className="font-bold text-text-primary mb-2">
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>रेटिंग</span>
          <span className="text-text-secondary font-normal"> / Rating</span>
          <span className="ml-2 text-primary-orange">{filters.rating > 0 ? `${filters.rating}+ ⭐` : "All"}</span>
        </h4>
        <input
          type="range"
          min={0}
          max={5}
          step={0.5}
          value={filters.rating}
          onChange={e => updateFilter("rating", parseFloat(e.target.value))}
          className="w-full accent-primary-orange"
          aria-label="Minimum rating filter"
        />
        <div className="flex justify-between text-xs text-text-secondary mt-1">
          <span>Any</span><span>5 ⭐</span>
        </div>
      </div>

      {/* Distance */}
      <div>
        <h4 className="font-bold text-text-primary mb-2">
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>दूरी</span>
          <span className="text-text-secondary font-normal"> / Distance</span>
        </h4>
        <div className="flex gap-2 flex-wrap">
          {DISTANCE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => updateFilter("distance", opt.value)}
              className={`px-4 py-2 rounded-xl border-2 font-semibold transition-colors ${
                filters.distance === opt.value
                  ? "bg-primary-blue text-white border-primary-blue"
                  : "border-border-light text-text-secondary hover:border-primary-blue"
              }`}
              aria-label={`Filter by ${opt.label}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gender */}
      <div>
        <h4 className="font-bold text-text-primary mb-2">
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>लिंग</span>
          <span className="text-text-secondary font-normal"> / Gender</span>
        </h4>
        <div className="space-y-2">
          {GENDER_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={(filters.gender || []).includes(opt.value)}
                onChange={() => toggleArray("gender", opt.value)}
                className="w-5 h-5 rounded accent-primary-orange"
                aria-label={opt.en}
              />
              <span>
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{opt.hi}</span>
                <span className="text-text-secondary"> / {opt.en}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Service Type */}
      <div>
        <h4 className="font-bold text-text-primary mb-2">
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>सेवा का प्रकार</span>
          <span className="text-text-secondary font-normal"> / Service Type</span>
        </h4>
        <div className="space-y-2">
          {SERVICE_TYPE_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={(filters.serviceType || []).includes(opt.value)}
                onChange={() => toggleArray("serviceType", opt.value)}
                className="w-5 h-5 rounded accent-primary-orange"
                aria-label={opt.en}
              />
              <span>
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{opt.hi}</span>
                <span className="text-text-secondary"> / {opt.en}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={resetFilters}
        className="w-full border-2 border-red-300 text-red-600 font-bold py-3 rounded-xl hover:bg-red-50 transition-colors"
        aria-label="Reset all filters"
      >
        <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>Filters Reset करें</span>
        <span> / Reset All</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 bg-primary-navy text-white font-bold px-5 py-3 rounded-xl"
          aria-label="Toggle filters"
        >
          <SlidersHorizontal size={20} />
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>Filters</span>
        </button>
        {open && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setOpen(false)}
            />
            <div className="fixed bottom-0 left-0 right-0 w-full bg-white rounded-t-2xl z-50 max-h-[85vh] overflow-y-auto p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Filters</h3>
                <button onClick={() => setOpen(false)} aria-label="Close filters"><X size={20} /></button>
              </div>
              {panel}
            </div>
          </>
        )}
      </div>
      {/* Desktop sidebar */}
      <div className={`hidden lg:block bg-white rounded-2xl border-2 border-border-light p-5 sticky top-20 ${className}`}>
        <h3 className="font-bold text-lg mb-5">
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>Filters</span>
          <span className="text-text-secondary font-normal"> / फ़िल्टर</span>
        </h3>
        {panel}
      </div>
    </>
  );
}
