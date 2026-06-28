import { CATEGORIES, getCategoryBySlug } from "@/lib/data/categories";
import { apiPost } from "./client";

// Static built-in list — used by visual surfaces (homepage tiles, /categories,
// /categories/[slug]) that depend on icon/image/subcategory metadata customs
// don't have. Keep this synchronous.
export async function getCategories() {
  return CATEGORIES;
}

export async function getSubcategories(slug) {
  const cat = getCategoryBySlug(slug);
  return cat ? cat.subcategories : [];
}

// Merged list: built-ins + admin-approved custom categories. Use this for
// search inputs, dropdowns, and worker/shop signup category pickers — anywhere
// a registered keyword should appear without a standalone landing page.
//
// Each entry has the shape:
//   { id, slug, nameHi, nameEn, custom?: true, subcategories: [] }
// Custom entries carry `custom: true` so consumers can render them with a
// neutral icon and skip subcategory UI.
//
// Network failures fall back to the built-in list — search must always render.
let _categoriesCache = null;
let _categoriesCacheAt = 0;
const CATEGORIES_TTL_MS = 60_000; // 1 min — admin approve → public visibility lag

export async function getAllCategoriesForSearch({ force = false } = {}) {
  const now = Date.now();
  if (!force && _categoriesCache && now - _categoriesCacheAt < CATEGORIES_TTL_MS) {
    return _categoriesCache;
  }
  try {
    const base = typeof window === "undefined" ? (process.env.NEXT_PUBLIC_APP_URL || "") : "";
    const res = await fetch(`${base}/api/categories/custom`, { cache: "no-store" });
    const data = res.ok ? await res.json() : { categories: [] };
    const customs = Array.isArray(data?.categories) ? data.categories : [];
    const customEntries = customs
      .filter(c => c?.slug && c?.nameEn) // defensive — bad rows skipped
      .map(c => ({
        id: c.slug,
        slug: c.slug,
        nameHi: c.nameHi || c.nameEn,
        nameEn: c.nameEn,
        custom: true,
        subcategories: [],
      }));
    // Built-ins first so familiar categories sort before newly-added ones.
    const merged = [...CATEGORIES, ...customEntries];
    _categoriesCache = merged;
    _categoriesCacheAt = now;
    return merged;
  } catch {
    return CATEGORIES;
  }
}

export async function submitCustomCategory(nameEn, nameHi) {
  try {
    return await apiPost("/api/categories/custom", { nameEn, nameHi });
  } catch (err) {
    return { success: false, message: err.message };
  }
}
