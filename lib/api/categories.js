// TODO: Replace with real API calls when backend is ready.

import { CATEGORIES, getCategoryBySlug } from "@/lib/data/categories";

export async function getCategories() {
  return CATEGORIES;
}

export async function getSubcategories(slug) {
  const cat = getCategoryBySlug(slug);
  return cat ? cat.subcategories : [];
}

export async function submitCustomCategory(name) {
  // TODO: When backend is ready, POST custom category to API so it appears
  // in future dropdowns for all users.
  return { success: true, name };
}
