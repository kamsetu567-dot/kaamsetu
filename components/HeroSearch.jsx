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

export default function HeroSearch({ initialQuery = "" }) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const router = useRouter();
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const results = fuse.search(query).slice(0, 8).map(r => r.item);
    setSuggestions(results);
    setShowSuggestions(true);
    setActiveSuggestion(-1);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;
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
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="flex rounded-2xl overflow-hidden shadow-2xl bg-white">
        <div className="flex items-center pl-5">
          <Search size={22} className="text-gray-400 flex-shrink-0" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="आपको क्या चाहिए? (Plumber, Halwai, Dancer...)"
          className="flex-1 px-4 py-5 text-lg text-text-primary focus:outline-none bg-transparent"
          aria-label="Search for services"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
        />
        {query && (
          <button type="button" onClick={() => { setQuery(""); setSuggestions([]); inputRef.current?.focus(); }} className="px-3 text-gray-400 hover:text-gray-600" aria-label="Clear search">
            <X size={18} />
          </button>
        )}
        <button
          type="submit"
          className="bg-accent-yellow text-primary-navy font-black text-lg px-6 py-5 hover:bg-yellow-400 transition-colors flex-shrink-0"
          aria-label="Search"
        >
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>खोजें</span>
          <span className="text-sm font-normal block text-center">/ Search</span>
        </button>
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-border-light z-50 overflow-hidden">
          {suggestions.map((item, i) => (
            <button
              key={i}
              onClick={() => handleSuggestionClick(item)}
              className={`w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-orange-50 transition-colors ${
                i === activeSuggestion ? "bg-orange-50" : ""
              }`}
              aria-label={item.label}
            >
              <Search size={16} className="text-gray-400 flex-shrink-0" />
              <div>
                <span className="font-medium text-text-primary">{item.label}</span>
                {item.category && (
                  <span className="text-xs text-text-secondary ml-2">in {item.category}</span>
                )}
                {item.type === "category" && (
                  <span className="ml-2 text-xs bg-primary-navy text-white px-1.5 py-0.5 rounded">Category</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
