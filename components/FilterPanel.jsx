"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useFilters } from "@/lib/context/FilterContext";
import CategorySelect from "./CategorySelect";
import { useT } from "@/lib/i18n/useT";

const DISTANCE_OPTIONS = [
  { value: 5, label: "5 km" },
  { value: 10, label: "10 km" },
  { value: 20, label: "20 km" },
];

export default function FilterPanel({ className = "" }) {
  const { filters, updateFilter, resetFilters } = useFilters();
  const [open, setOpen] = useState(false);
  const t = useT();

  const GENDER_OPTIONS = [
    { value: "male",   label: t({ hi: 'पुरुष',  en: 'Male' }) },
    { value: "female", label: t({ hi: 'महिला', en: 'Female' }) },
  ];

  const SERVICE_TYPE_OPTIONS = [
    { value: "home_visit",  label: t({ hi: 'घर पर आकर',       en: 'Home Visit' }) },
    { value: "shop_office", label: t({ hi: 'दुकान / ऑफिस पर', en: 'Shop or Office' }) },
  ];

  const SORT_OPTIONS = [
    { value: "rating",   label: t({ hi: 'रेटिंग', en: 'Rating' }) },
    { value: "distance", label: t({ hi: 'दूरी',   en: 'Distance' }) },
    { value: "newest",   label: t({ hi: 'नयापन',  en: 'Newest' }) },
  ];

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
        <h4 className="font-bold text-brand-navy mb-2">{t({ hi: 'क्रम', en: 'Sort By' })}</h4>
        <select
          value={filters.sortBy}
          onChange={e => updateFilter("sortBy", e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-brand-navy"
          aria-label="Sort by"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <h4 className="font-bold text-brand-navy mb-2">{t({ hi: 'कैटेगरी', en: 'Category' })}</h4>
        <CategorySelect
          value={filters.category}
          onChange={v => updateFilter("category", v)}
          level="main"
        />
      </div>

      {/* Rating */}
      <div>
        <h4 className="font-bold text-brand-navy mb-2">
          {t({ hi: 'रेटिंग', en: 'Rating' })}
          <span className="ml-2 text-brand-yellow font-bold">{filters.rating > 0 ? `${filters.rating}+ ⭐` : t({ hi: 'सभी', en: 'All' })}</span>
        </h4>
        <input
          type="range" min={0} max={5} step={0.5}
          value={filters.rating}
          onChange={e => updateFilter("rating", parseFloat(e.target.value))}
          className="w-full accent-brand-navy"
          aria-label="Minimum rating filter"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{t({ hi: 'कोई भी', en: 'Any' })}</span><span>5 ⭐</span>
        </div>
      </div>

      {/* Distance */}
      <div>
        <h4 className="font-bold text-brand-navy mb-2">{t({ hi: 'दूरी', en: 'Distance' })}</h4>
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
        <h4 className="font-bold text-brand-navy mb-2">{t({ hi: 'लिंग', en: 'Gender' })}</h4>
        <div className="space-y-2">
          {GENDER_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={(filters.gender || []).includes(opt.value)}
                onChange={() => toggleArray("gender", opt.value)}
                className="w-5 h-5 rounded accent-brand-navy"
                aria-label={opt.label}
              />
              <span className="font-hindi">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Service Type */}
      <div>
        <h4 className="font-bold text-brand-navy mb-2">{t({ hi: 'सेवा का प्रकार', en: 'Service Type' })}</h4>
        <div className="space-y-2">
          {SERVICE_TYPE_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={(filters.serviceType || []).includes(opt.value)}
                onChange={() => toggleArray("serviceType", opt.value)}
                className="w-5 h-5 rounded accent-brand-navy"
                aria-label={opt.label}
              />
              <span className="font-hindi">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Employment Type */}
      <div>
        <h4 className="font-bold text-brand-navy mb-2">{t({ hi: 'काम का प्रकार', en: 'Employment Type' })}</h4>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "",          label: t({ hi: 'सभी',      en: 'All' }) },
            { value: "full_time", label: t({ hi: 'फुल टाइम', en: 'Full Time' }) },
            { value: "part_time", label: t({ hi: 'पार्ट टाइम', en: 'Part Time' }) },
          ].map(opt => (
            <button key={opt.value} onClick={() => updateFilter("employmentType", opt.value)}
              className={`px-4 py-2 rounded-xl border-2 font-semibold text-sm transition-colors ${
                filters.employmentType === opt.value
                  ? "bg-brand-navy text-white border-brand-navy"
                  : "border-gray-200 text-gray-500 hover:border-brand-navy"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Experience Level */}
      <div>
        <h4 className="font-bold text-brand-navy mb-2">{t({ hi: 'अनुभव', en: 'Experience Level' })}</h4>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "",           label: t({ hi: 'सभी',         en: 'All' }) },
            { value: "experienced", label: t({ hi: 'अनुभवी',      en: 'Experienced' }) },
            { value: "fresher",    label: t({ hi: 'फ्रेशर',       en: 'Fresher' }) },
          ].map(opt => (
            <button key={opt.value} onClick={() => updateFilter("experienceLevel", opt.value)}
              className={`px-4 py-2 rounded-xl border-2 font-semibold text-sm transition-colors ${
                filters.experienceLevel === opt.value
                  ? "bg-green-600 text-white border-green-600"
                  : "border-gray-200 text-gray-500 hover:border-green-600"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={resetFilters}
        className="w-full border-2 border-red-300 text-red-600 font-bold py-3 rounded-xl hover:bg-red-50 transition-colors font-hindi"
        aria-label="Reset all filters"
      >
        {t({ hi: 'Filters Reset करें', en: 'Reset All Filters' })}
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
          <span className="font-hindi">{t({ hi: 'फ़िल्टर', en: 'Filters' })}</span>
        </button>
        {open && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />
            <div className="fixed bottom-0 left-0 right-0 w-full bg-white rounded-t-2xl z-50 max-h-[85vh] overflow-y-auto p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg font-hindi">{t({ hi: 'फ़िल्टर', en: 'Filters' })}</h3>
                <button onClick={() => setOpen(false)} aria-label="Close filters"><X size={20} /></button>
              </div>
              {panel}
            </div>
          </>
        )}
      </div>
      {/* Desktop sidebar */}
      <div className={`hidden lg:block bg-white rounded-2xl border-2 border-gray-200 p-5 sticky top-20 ${className}`}>
        <h3 className="font-bold text-lg mb-5 font-hindi">{t({ hi: 'फ़िल्टर', en: 'Filters' })}</h3>
        {panel}
      </div>
    </>
  );
}
