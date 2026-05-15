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
        <h4 className="font-bold text-brand-navy mb-2">
          <span className="font-hindi">क्रम</span>
          <span className="text-gray-500 font-normal"> / Sort By</span>
        </h4>
        <select
          value={filters.sortBy}
          onChange={e => updateFilter("sortBy", e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-brand-navy"
          aria-label="Sort by"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.hi} / {o.en}</option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <h4 className="font-bold text-brand-navy mb-2 font-hindi">Category</h4>
        <CategorySelect
          value={filters.category}
          onChange={v => updateFilter("category", v)}
          level="main"
        />
      </div>

      {/* Rating */}
      <div>
        <h4 className="font-bold text-brand-navy mb-2">
          <span className="font-hindi">रेटिंग</span>
          <span className="text-gray-500 font-normal"> / Rating</span>
          <span className="ml-2 text-brand-yellow font-bold">{filters.rating > 0 ? `${filters.rating}+ ⭐` : "All"}</span>
        </h4>
        <input
          type="range"
          min={0}
          max={5}
          step={0.5}
          value={filters.rating}
          onChange={e => updateFilter("rating", parseFloat(e.target.value))}
          className="w-full accent-brand-navy"
          aria-label="Minimum rating filter"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Any</span><span>5 ⭐</span>
        </div>
      </div>

      {/* Distance */}
      <div>
        <h4 className="font-bold text-brand-navy mb-2">
          <span className="font-hindi">दूरी</span>
          <span className="text-gray-500 font-normal"> / Distance</span>
        </h4>
        <div className="flex gap-2 flex-wrap">
          {DISTANCE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => updateFilter("distance", opt.value)}
              className={`px-4 py-2 rounded-xl border-2 font-semibold transition-colors ${
                filters.distance === opt.value
                  ? "bg-brand-navy text-white border-brand-navy"
                  : "border-gray-200 text-gray-500 hover:border-brand-navy"
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
        <h4 className="font-bold text-brand-navy mb-2">
          <span className="font-hindi">लिंग</span>
          <span className="text-gray-500 font-normal"> / Gender</span>
        </h4>
        <div className="space-y-2">
          {GENDER_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={(filters.gender || []).includes(opt.value)}
                onChange={() => toggleArray("gender", opt.value)}
                className="w-5 h-5 rounded accent-brand-navy"
                aria-label={opt.en}
              />
              <span>
                <span className="font-hindi">{opt.hi}</span>
                <span className="text-gray-500"> / {opt.en}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Service Type */}
      <div>
        <h4 className="font-bold text-brand-navy mb-2">
          <span className="font-hindi">सेवा का प्रकार</span>
          <span className="text-gray-500 font-normal"> / Service Type</span>
        </h4>
        <div className="space-y-2">
          {SERVICE_TYPE_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={(filters.serviceType || []).includes(opt.value)}
                onChange={() => toggleArray("serviceType", opt.value)}
                className="w-5 h-5 rounded accent-brand-navy"
                aria-label={opt.en}
              />
              <span>
                <span className="font-hindi">{opt.hi}</span>
                <span className="text-gray-500"> / {opt.en}</span>
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
        <span className="font-hindi">Filters Reset करें</span>
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
          className="flex items-center gap-2 bg-brand-navy text-white font-bold px-5 py-3 rounded-xl"
          aria-label="Toggle filters"
        >
          <SlidersHorizontal size={20} />
          <span className="font-hindi">Filters</span>
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
      <div className={`hidden lg:block bg-white rounded-2xl border-2 border-gray-200 p-5 sticky top-20 ${className}`}>
        <h3 className="font-bold text-lg mb-5">
          <span className="font-hindi">Filters</span>
          <span className="text-gray-500 font-normal"> / फ़िल्टर</span>
        </h3>
        {panel}
      </div>
    </>
  );
}
