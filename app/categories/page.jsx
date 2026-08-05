import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryCard from "@/components/CategoryCard";
import CategoriesHeading from "@/components/CategoriesHeading";
import { CATEGORIES } from "@/lib/data/categories";
import { connectDB } from "@/lib/db/mongoose";
import CustomCategory from "@/lib/models/CustomCategory";

export const metadata = {
  title: "सभी सेवाएँ / All Categories — Karvia",
  description: "Browse all service categories on Karvia — Construction, Events, Home Services, Talent and more.",
};

// Re-render at most every 60s so an admin-added category appears here without a
// redeploy (same freshness window as getAllCategoriesForSearch's cache).
export const revalidate = 60;

// Admin-approved custom categories, shaped like built-ins so CategoryCard can
// render them (no image → gradient tile; no subs → empty preview line).
// DB hiccups must never break the browse page — fall back to built-ins only.
async function getApprovedCustoms() {
  try {
    await connectDB();
    const customs = await CustomCategory.find({ status: "approved" }).sort({ createdAt: 1 }).lean();
    const builtinSlugs = new Set(CATEGORIES.map(c => c.slug));
    return customs
      .filter(c => c?.slug && c?.nameEn && !builtinSlugs.has(c.slug))
      .map(c => ({
        slug: c.slug,
        nameEn: c.nameEn,
        nameHi: c.nameHi || c.nameEn,
        image: null,
        color: "bg-slate-100 text-slate-700",
        subcategories: [],
      }));
  } catch {
    return [];
  }
}

export default async function CategoriesPage() {
  const customs = await getApprovedCustoms();
  const all = [...CATEGORIES, ...customs];
  return (
    <>
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-10 w-full">
        <CategoriesHeading />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {all.map(category => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
