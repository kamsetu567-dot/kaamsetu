import Link from "next/link";
import { Hammer, Briefcase, Users, Store, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSearch from "@/components/HeroSearch";
import ActionCard from "@/components/ActionCard";
import CategoryCard from "@/components/CategoryCard";
import { CATEGORIES } from "@/lib/data/categories";

export const metadata = {
  title: "KaamSetu — हर काम, हर जगह | Local Services Marketplace",
  description: "मिस्त्री, हलवाई, डांसर, ट्यूटर — सभी सेवाएँ एक ही जगह पर। KaamSetu connects you with local service workers in 5–30 seconds.",
};

const ACTION_CARDS = [
  { hindi: "काम करवाओ", english: "Hire Worker", icon: Hammer, color: "orange", href: "/client/request-service" },
  { hindi: "काम ढूंढो", english: "Find Work", icon: Briefcase, color: "blue", href: "/auth/signup/worker" },
  { hindi: "टीम / पार्टनर बनें", english: "Team / Partner", icon: Users, color: "green", href: "/auth/signup/worker" },
  { hindi: "दुकान / सामान", english: "Shop / Materials", icon: Store, color: "navy", href: "/auth/signup/shop" },
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section
          className="relative py-16 md:py-24 px-4"
          style={{
            background: "linear-gradient(135deg, #1E3A8A 0%, #1e40af 30%, #7c3aed 60%, #F97316 100%)",
          }}
        >
          <div className="relative max-w-4xl mx-auto text-center">
            {/* Main headline */}
            <h1
              className="text-4xl md:text-6xl font-black text-white leading-tight mb-3"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              हर काम, हर जगह!
            </h1>
            <p
              className="text-2xl md:text-3xl font-bold text-accent-yellow mb-4"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              सबकुछ यहीं मिलेगा!
            </p>
            <p
              className="text-white/80 text-base md:text-lg mb-2"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              मिस्त्री, हलवाई, डांसर, ट्यूटर — सभी सेवाएँ एक ही जगह पर
            </p>
            <p className="text-white/60 text-sm mb-10">
              Plumber, Caterer, Dancer, Tutor — All services in one place
            </p>

            {/* Search bar */}
            <HeroSearch />

          </div>
        </section>

        {/* Four Action Cards */}
        <section className="max-w-7xl mx-auto px-4 -mt-6 relative z-10 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ACTION_CARDS.map(card => (
              <ActionCard key={card.hindi} {...card} />
            ))}
          </div>
        </section>

        {/* Categories Grid */}
        <section className="max-w-7xl mx-auto px-4 py-14">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2
                className="text-2xl md:text-3xl font-black text-text-primary"
                style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
              >
                सभी सेवाएँ
              </h2>
              <p className="text-text-secondary text-sm mt-1">Browse All Services</p>
            </div>
            <Link
              href="/categories"
              className="flex items-center gap-2 text-primary-blue font-semibold hover:underline text-sm"
              aria-label="View all categories"
            >
              <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>सभी देखें</span>
              <span>/ View All</span>
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CATEGORIES.map(category => (
              <CategoryCard key={category.slug} category={category} />
            ))}
          </div>
        </section>

        {/* Promotional Banners */}
        <section className="max-w-7xl mx-auto px-4 pb-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Banner 1 — Add Your Team */}
            <Link
              href="/auth/signup/worker"
              className="relative overflow-hidden rounded-2xl group block"
              aria-label="Join as a worker — Add Your Team"
            >
              <div className="bg-gradient-to-r from-primary-orange to-working-orange p-8 h-full min-h-44">
                <div className="absolute top-3 right-3">
                  <span className="bg-accent-yellow text-primary-navy text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide">
                    EXCLUSIVE
                  </span>
                </div>
                <p className="text-xs text-white/70 font-semibold uppercase tracking-wider mb-2">For Workers</p>
                <h3
                  className="text-2xl font-black text-white mb-2 leading-tight"
                  style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                >
                  अपनी टीम जोड़ें
                </h3>
                <p className="text-white/90 font-semibold">Add Your Team</p>
                <p
                  className="text-white/70 text-sm mt-2"
                  style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                >
                  मजदूर / मिस्त्री / ख़लीफ़ा — Register करें
                </p>
                <div className="mt-4 inline-flex items-center gap-2 bg-white text-primary-orange font-bold text-sm px-4 py-2 rounded-xl group-hover:bg-accent-yellow group-hover:text-primary-navy transition-colors">
                  <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>अभी Join करें</span>
                  <span>/ Join Now</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            </Link>

            {/* Banner 2 — Place Your Ad */}
            <Link
              href="/auth/signup/shop"
              className="relative overflow-hidden rounded-2xl group block"
              aria-label="Place your advertisement"
            >
              <div className="bg-gradient-to-r from-slate-100 to-white border-2 border-border-light p-8 h-full min-h-44">
                <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-2">For Shops & Businesses</p>
                <h3
                  className="text-2xl font-black text-text-primary mb-2 leading-tight"
                  style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                >
                  विज्ञापन लगाएं
                </h3>
                <p className="text-text-secondary font-semibold">Place Your Ad</p>
                <p
                  className="text-text-secondary text-sm mt-2"
                  style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                >
                  अपना विज्ञापन यहाँ लगाएं — लाखों तक पहुँचें
                </p>
                <div className="mt-4 inline-flex items-center gap-2 bg-primary-navy text-white font-bold text-sm px-4 py-2 rounded-xl group-hover:bg-primary-blue transition-colors">
                  <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>Ad लगाएं</span>
                  <span>/ Advertise</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-primary-navy py-14 px-4">
          <div className="max-w-7xl mx-auto">
            <h2
              className="text-2xl md:text-3xl font-black text-white text-center mb-10"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              कैसे काम करता है? <span className="text-accent-yellow text-xl font-normal">/ How it works</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              {[
                { step: "1", hi: "Request भेजें", en: "Send a Request", desc: "Category और location बताएं" },
                { step: "2", hi: "Worker मिलेगा", en: "Worker is Matched", desc: "5–30 सेकंड में notification जाती है" },
                { step: "3", hi: "Call आएगी", en: "Get a Call", desc: "Worker सीधे आपको call करेगा" },
              ].map(s => (
                <div key={s.step} className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-accent-yellow text-primary-navy rounded-full flex items-center justify-center text-3xl font-black mb-4">
                    {s.step}
                  </div>
                  <h3
                    className="text-white font-bold text-xl mb-1"
                    style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                  >
                    {s.hi}
                  </h3>
                  <p className="text-white/60 text-sm">{s.en}</p>
                  <p
                    className="text-white/70 text-sm mt-2"
                    style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                  >
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
