"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/data/categories";
import { ChevronDown } from "lucide-react";

// Reusable category dropdown with built-in "Other / अन्य" support
export default function CategorySelect({
  value = "",
  onChange,
  categories = CATEGORIES,
  level = "main", // "main" | "sub"
  parentSlug = "", // used when level = "sub" to filter subcategories
  placeholder,
  error = "",
  label,
  labelEn,
}) {
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherText, setOtherText] = useState("");

  const options =
    level === "main"
      ? categories.map(c => ({ value: c.slug, labelHi: c.nameHi, labelEn: c.nameEn }))
      : (categories.find(c => c.slug === parentSlug)?.subcategories || []).map(s => ({
          value: s,
          labelHi: s,
          labelEn: s,
        }));

  function handleSelect(e) {
    const val = e.target.value;
    if (val === "__other__") {
      setShowOtherInput(true);
      onChange("__other__");
    } else {
      setShowOtherInput(false);
      setOtherText("");
      onChange(val);
    }
  }

  function handleOtherInput(e) {
    setOtherText(e.target.value);
    onChange(e.target.value);
  }

  const defaultPlaceholder = level === "main" ? "-- Category चुनें / Select Category --" : "-- Subcategory चुनें / Select Subcategory --";

  return (
    <div>
      {label && (
        <label className="block mb-1.5">
          <span className="font-semibold text-text-primary" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            {label}
          </span>
          {labelEn && <span className="text-text-secondary font-normal ml-1 text-sm">/ {labelEn}</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={showOtherInput ? "__other__" : value}
          onChange={handleSelect}
          className={`w-full px-4 py-4 text-base border-2 rounded-xl appearance-none bg-white pr-10 focus:outline-none transition-colors ${
            error ? "border-red-400" : "border-border-light focus:border-primary-orange"
          }`}
          aria-label={labelEn || (level === "main" ? "Select category" : "Select subcategory")}
        >
          <option value="">{placeholder || defaultPlaceholder}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.labelHi}{opt.labelEn && opt.labelHi !== opt.labelEn ? "" : ""}
            </option>
          ))}
          <option value="__other__">अन्य / Other</option>
        </select>
        <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
      </div>

      {showOtherInput && (
        <div className="mt-2">
          <input
            type="text"
            value={otherText}
            onChange={handleOtherInput}
            placeholder="अपनी category यहाँ लिखें / Type your category here"
            className="w-full px-4 py-4 text-base border-2 border-primary-orange rounded-xl focus:outline-none"
            aria-label="Type custom category"
          />
          {/* TODO: When backend is ready, POST custom category to API so it appears in future dropdowns for all users. */}
        </div>
      )}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
