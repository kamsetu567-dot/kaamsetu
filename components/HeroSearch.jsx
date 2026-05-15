"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import Fuse from "fuse.js";
import { CATEGORIES, getAllSubcategories } from "@/lib/data/categories";

const allSearchItems = [
  ...CATEGORIES.map(c => ({ type: "category", label: c.nameEn, labelHi: c.nameHi, href: `/categories/${c.slug}` })),
  ...getAllSubcategories().map(s => ({
    type: "subcategory",
    label: s.subcategory,
    labelHi: s.subcategory,
    category: s.categoryName,
    href: `/categories/${s.categorySlug}`,
  })),
];

const fuse = new Fuse(allSearchItems, {
  keys: ["label", "labelHi", "category"],
  threshold: 0.4,
  includeScore: true,
});

export default function HeroSearch({ initialQuery = "", onQueryChange }) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [inputError, setInputError] = useState(false);
  const router = useRouter();
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Sync when initialQuery prop changes (e.g. URL navigation between search pages)
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      onQueryChange?.(query);
      return;
    }
    const results = fuse.search(query).slice(0, 8).map(r => r.item);
    setSuggestions(results);
    setShowSuggestions(true);
    setActiveSuggestion(-1);
    onQueryChange?.(query);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    function handleScroll(e) {
      if (containerRef.current && containerRef.current.contains(e.target)) return;
      setShowSuggestions(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim()) {
      setInputError(true);
      inputRef.current?.focus();
      setTimeout(() => setInputError(false), 600);
      return;
    }
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  function handleSuggestionClick(item) {
    setQuery(item.label);
    setShowSuggestions(false);
    router.push(item.href);
  }

  function handleKeyDown(e) {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion(prev => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && activeSuggestion >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[activeSuggestion]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto overflow-visible">
      <form onSubmit={handleSubmit} className={`flex items-stretch w-full rounded-xl overflow-hidden border bg-white shadow-sm transition-colors ${inputError ? "border-red-400" : "border-gray-200"}`}>
        <div className="flex items-center pl-4 pr-2 bg-white flex-shrink-0">
          <Search size={20} className="text-gray-400 flex-shrink-0" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="आपको क्या चाहिए? (Plumber, Halwai, Dancer...)"
          className="flex-1 py-3.5 pr-2 text-base outline-none bg-white min-w-0 text-brand-navy"
          aria-label="Search for services"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
        />
        {query && (
          <button type="button" onClick={() => { setQuery(""); setSuggestions([]); inputRef.current?.focus(); }} className="px-2 text-gray-400 hover:text-gray-600 flex-shrink-0" aria-label="Clear search">
            <X size={16} />
          </button>
        )}
        <button
          type="submit"
          className="bg-brand-yellow text-brand-navy font-bold px-5 py-3.5 flex-shrink-0 flex flex-col items-center justify-center leading-tight hover:opacity-90 transition-opacity"
          aria-label="Search"
        >
          <span className="text-base font-bold font-hindi">खोजें</span>
          <span className="text-xs font-normal hidden sm:block">/ Search</span>
        </button>
      </form>

      {/* Suggestions dropdown — fixed to escape any parent overflow:hidden */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 z-[9999] overflow-y-auto"
          style={{
            top: containerRef.current ? containerRef.current.getBoundingClientRect().bottom + 4 : "auto",
            left: containerRef.current ? containerRef.current.getBoundingClientRect().left : 0,
            width: containerRef.current ? containerRef.current.getBoundingClientRect().width : "100%",
            maxHeight: "260px",
          }}
        >
          {suggestions.map((item, i) => (
            <button
              key={i}
              onClick={() => handleSuggestionClick(item)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors ${
                i === activeSuggestion ? "bg-gray-50" : ""
              }`}
              aria-label={item.label}
            >
              <Search size={16} className="text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <span className="font-medium text-brand-navy text-sm block truncate">{item.label}</span>
                {item.category && (
                  <span className="text-xs text-gray-400">in {item.category}</span>
                )}
                {item.type === "category" && (
                  <span className="ml-2 text-xs bg-brand-navy text-white px-1.5 py-0.5 rounded">Category</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
