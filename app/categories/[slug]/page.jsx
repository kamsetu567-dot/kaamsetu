import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EmptyState from "@/components/EmptyState";
import { getCategoryBySlug, CATEGORIES } from "@/lib/data/categories";

export function generateStaticParams() {
  return CATEGORIES.map(c => ({ slug: c.slug }));
}

export function generateMetadata({ params }) {
  const cat = getCategoryBySlug(params.slug);
  if (!cat) return { title: "Category Not Found" };
  return {
    title: `${cat.nameEn} — ${cat.nameHi} | KaamSetu`,
    description: `Find ${cat.nameEn} workers: ${cat.subcategories.slice(0, 4).join(", ")}`,
  };
}

export default function CategoryPage({ params }) {
  const category = getCategoryBySlug(params.slug);
  if (!category) notFound();

  return (
    <>
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-text-secondary mb-6">
          <Link href="/" className="hover:text-primary-blue">Home</Link>
          <span>/</span>
          <Link href="/categories" className="hover:text-primary-blue">All Categories</Link>
          <span>/</span>
          <span className="text-text-primary font-semibold">{category.nameEn}</span>
        </nav>

        {/* Category Header */}
        <div className="bg-gradient-to-r from-primary-navy to-primary-blue rounded-3xl p-8 mb-8 text-white">
          <h1
            className="text-3xl font-black mb-1"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            {category.nameHi}
          </h1>
          <p className="text-xl font-semibold opacity-90">{category.nameEn}</p>
          <p className="text-white/70 mt-2">{category.subcategories.length} services available</p>
        </div>

        {/* Subcategories */}
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
                href={`/workers?category=${params.slug}&subcategory=${encodeURIComponent(sub)}`}
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
            href={`/client/request-service?category=${params.slug}`}
            className="inline-flex items-center gap-2 bg-white text-primary-orange font-black text-lg px-8 py-4 rounded-2xl hover:bg-accent-yellow hover:text-primary-navy transition-colors"
            aria-label="Request service now"
          >
            <Search size={20} />
            <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>Request भेजें</span>
            <span>/ Send Request</span>
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
