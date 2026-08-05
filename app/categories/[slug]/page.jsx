import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EmptyState from "@/components/EmptyState";
import AdSlot from "@/components/AdSlot";
import { getCategoryBySlug, CATEGORIES } from "@/lib/data/categories";
import { connectDB } from "@/lib/db/mongoose";
import CustomCategory from "@/lib/models/CustomCategory";

export function generateStaticParams() {
  return CATEGORIES.map(c => ({ slug: c.slug }));
}

// Built-in first; else an admin-approved custom category (shaped the same, with
// no subcategories). Custom slugs aren't in generateStaticParams, so they
// render dynamically on request — exactly what a just-approved category needs.
async function resolveCategory(slug) {
  const builtin = getCategoryBySlug(slug);
  if (builtin) return builtin;
  try {
    await connectDB();
    const c = await CustomCategory.findOne({ slug, status: "approved" }).lean();
    if (!c) return null;
    return { slug: c.slug, nameEn: c.nameEn, nameHi: c.nameHi || c.nameEn, subcategories: [] };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cat = await resolveCategory(slug);
  if (!cat) return { title: "Category Not Found" };
  return {
    title: `${cat.nameEn} — ${cat.nameHi} | Karvia`,
    description: cat.subcategories.length
      ? `Find ${cat.nameEn} workers: ${cat.subcategories.slice(0, 4).join(", ")}`
      : `Find ${cat.nameEn} workers on Karvia`,
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const category = await resolveCategory(slug);
  if (!category) notFound();

  return (
    <>
      <Header />
      <main className="flex-1 w-full">
        {/* Category Header with breadcrumb inside */}
        <div className="bg-gradient-to-r from-primary-navy to-primary-blue px-4 py-6 mb-8">
          <div className="max-w-7xl mx-auto">
            <nav className="flex items-center gap-1.5 text-sm flex-wrap mb-4">
              <Link href="/" className="text-yellow-300 hover:text-white transition-colors">Home</Link>
              <span className="text-gray-400">/</span>
              <Link href="/categories" className="text-yellow-300 hover:text-white transition-colors">
                सभी कैटेगरी / All Categories
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-white font-semibold">{category.nameEn}</span>
            </nav>
            <h1
              className="text-3xl font-black text-white mb-1"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              {category.nameHi}
            </h1>
            <p className="text-xl font-semibold text-white/90">{category.nameEn}</p>
            {category.subcategories.length > 0 && (
              <p className="text-white/70 mt-2 text-sm">{category.subcategories.length} services available</p>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-8">

        <AdSlot variant="banner-wide" category={category.slug} limit={3} className="mb-6" />

        {/* Subcategories — custom categories have none; send those straight to
            the worker list for this category instead of an empty grid. */}
        {category.subcategories.length === 0 ? (
          <div className="mb-8">
            <Link
              href={`/workers?category=${slug}`}
              className="flex items-center justify-between bg-white border-2 border-border-light rounded-2xl px-5 py-4 hover:border-primary-orange hover:shadow-md transition-all group"
              aria-label={`Browse ${category.nameEn} workers`}
            >
              <span
                className="font-semibold text-text-primary group-hover:text-primary-orange transition-colors"
                style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
              >
                {category.nameHi} workers देखें / Browse {category.nameEn} workers
              </span>
              <ArrowRight size={18} className="text-text-secondary group-hover:text-primary-orange transition-colors flex-shrink-0" />
            </Link>
          </div>
        ) : (
        <div className="mb-8">
          <h2
            className="text-xl font-black text-text-primary mb-4"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            सेवाएँ चुनें / Choose a Service
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {category.subcategories.map(sub => (
              <Link
                key={sub}
                href={`/workers?category=${slug}&subcategory=${encodeURIComponent(sub)}`}
                className="flex items-center justify-between bg-white border-2 border-border-light rounded-2xl px-5 py-4 hover:border-primary-orange hover:shadow-md transition-all group"
                aria-label={`Find ${sub} workers`}
              >
                <span
                  className="font-semibold text-text-primary group-hover:text-primary-orange transition-colors"
                  style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                >
                  {sub}
                </span>
                <ArrowRight size={18} className="text-text-secondary group-hover:text-primary-orange transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
        )}

        {/* Quick Request CTA */}
        <div className="bg-primary-orange rounded-3xl p-8 text-white text-center">
          <h3
            className="text-2xl font-black mb-2"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            अभी Worker चाहिए?
          </h3>
          <p className="text-white/80 mb-5">Need a worker right now? Send a request!</p>
          <Link
            href={`/client/request-service?category=${slug}`}
            className="inline-flex items-center gap-2 bg-white text-primary-orange font-black text-lg px-8 py-4 rounded-2xl hover:bg-accent-yellow hover:text-primary-navy transition-colors"
            aria-label="Request service now"
          >
            <Search size={20} />
            <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>Request भेजें</span>
            <span>/ Send Request</span>
          </Link>
        </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
