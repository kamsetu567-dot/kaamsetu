import { CATEGORIES, getCategoryBySlug } from "@/lib/data/categories";
import { apiPost } from "./client";

export async function getCategories() {
  return CATEGORIES;
}

export async function getSubcategories(slug) {
  const cat = getCategoryBySlug(slug);
  return cat ? cat.subcategories : [];
}

export async function submitCustomCategory(nameEn, nameHi) {
  try {
    return await apiPost("/api/categories/custom", { nameEn, nameHi });
  } catch (err) {
    return { success: false, message: err.message };
  }
}
