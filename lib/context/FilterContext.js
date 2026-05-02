"use client";

import { createContext, useContext, useState, useCallback } from "react";

const FilterContext = createContext(null);

const DEFAULT_FILTERS = {
  query: "",
  category: "",
  subcategory: "",
  rating: 0,
  distance: 10,
  gender: [],       // ["male","female"]
  serviceType: [],  // ["home_visit","shop_office"]
  sortBy: "rating", // "rating"|"distance"|"newest"
};

export function FilterProvider({ children }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const updateFilters = useCallback((updates) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <FilterContext.Provider value={{ filters, updateFilter, updateFilters, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used within FilterProvider");
  return ctx;
}
