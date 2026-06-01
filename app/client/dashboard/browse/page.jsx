"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search, MapPin, Star, ArrowRight, ShieldCheck, Briefcase,
  User, Sparkles, ChevronRight,
} from "lucide-react";
import { CATEGORIES } from "@/lib/data/categories";
import { getWorkers } from "@/lib/api/workers";

/* ── tiny helpers ─────────────────────────────────────────────── */
const CATEGORY_ICON_BG = [
  "bg-orange-50", "bg-blue-50", "bg-violet-50", "bg-purple-50",
  "bg-rose-50", "bg-cyan-50", "bg-yellow-50", "bg-slate-50",
  "bg-red-50", "bg-indigo-50", "bg-teal-50", "bg-emerald-50",
];

/* ── Worker mini-card for the featured section ───────────────── */
function FeaturedWorkerCard({ w }) {
  return (
    <Link
      href={`/workers/${w.id}`}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      {/* Photo strip */}
      <div className="relative h-32 bg-gradient-to-br from-brand-navy/5 to-brand-navy/10">
        {w.photo ? (
          <Image
            src={w.photo}
            alt={w.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width:640px)50vw,25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User size={40} className="text-gray-300" />
          </div>
        )}
        {/* Verified badge */}
        <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-brand-navy text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <ShieldCheck size={10} /> Verified
        </span>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-bold text-sm text-brand-navy truncate">{w.name}</p>
        <p className="text-xs text-gray-500 truncate font-hindi mt-0.5">
          {w.category || w.subcategory || "—"}
        </p>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
          <span className="flex items-center gap-0.5">
            <Star size={11} className="text-yellow-400 fill-yellow-400" />
            {w.rating?.toFixed(1) || "New"}
          </span>
          {w.experience > 0 && (
            <span className="flex items-center gap-0.5">
              <Briefcase size={11} /> {w.experience} yr
            </span>
          )}
          {w.city && (
            <span className="flex items-center gap-0.5">
              <MapPin size={11} /> {w.city}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ── skeleton ─────────────────────────────────────────────────── */
function WorkerSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-32 bg-gray-100" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════ */
export default function BrowseServicesPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [featured, setFeatured] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  // Fetch a handful of top-rated workers on mount
  useEffect(() => {
    setLoadingFeatured(true);
    getWorkers({ sortBy: "rating" })
      .then((list) => setFeatured(list.slice(0, 8)))
      .finally(() => setLoadingFeatured(false));
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/workers?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div className="space-y-8">
      {/* ── HEADER + SEARCH ──────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-brand-navy to-blue-900 rounded-3xl p-6 md:p-8">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-brand-yellow" />
          <h2 className="text-xl font-black text-white font-hindi">
            सेवाएँ ढूंढें / Browse Services
          </h2>
        </div>
        <p className="text-white/50 text-sm mb-5 font-hindi">
          अपनी ज़रूरत की सेवा या वर्कर ढूंढें / Find the service or worker you need
        </p>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Plumber, Electrician, Cook, Painter..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-0 bg-white text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-brand-yellow font-hindi placeholder:text-gray-400"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            className="bg-brand-yellow text-brand-navy font-black px-6 py-3.5 rounded-2xl hover:bg-amber-400 transition-colors text-sm md:text-base whitespace-nowrap"
          >
            खोजें
          </button>
        </form>
      </div>

      {/* ── CATEGORY GRID ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-brand-navy font-hindi">
            सेवा कैटेगरी / Service Categories
          </h3>
          <Link
            href="/categories"
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
          >
            सभी देखें <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.slug}
              href={`/workers?category=${cat.slug}`}
              className={`group relative rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all ${CATEGORY_ICON_BG[i % CATEGORY_ICON_BG.length]}`}
            >
              {/* Category image background */}
              <div className="relative h-24 sm:h-28">
                <Image
                  src={cat.image}
                  alt={cat.nameEn}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width:640px)50vw,(max-width:768px)33vw,25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </div>

              {/* Text overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <p className="text-white text-xs sm:text-sm font-black leading-tight drop-shadow font-hindi">
                  {cat.nameHi}
                </p>
                <p className="text-white/70 text-[10px] leading-tight">{cat.nameEn}</p>
              </div>

              {/* Arrow indicator */}
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={14} className="text-brand-navy" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── FEATURED WORKERS ─────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-brand-navy font-hindi">
            ⭐ टॉप Workers / Featured Workers
          </h3>
          <Link
            href="/workers"
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
          >
            सभी देखें <ArrowRight size={12} />
          </Link>
        </div>

        {loadingFeatured ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <WorkerSkeleton key={i} />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-gray-400 text-sm font-hindi">
              अभी कोई workers उपलब्ध नहीं / No workers available yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {featured.map((w) => (
              <FeaturedWorkerCard key={w.id} w={w} />
            ))}
          </div>
        )}
      </div>

      {/* ── QUICK ACTIONS ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/client/request-service"
          className="flex items-center gap-4 bg-gradient-to-br from-green-50 to-green-100/60 border-2 border-green-200 rounded-2xl p-5 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0">
            <Briefcase size={22} className="text-white" />
          </div>
          <div>
            <p className="font-black text-brand-navy font-hindi text-sm">
              नई Request भेजें / New Service Request
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Tell us what you need — we'll find the right worker
            </p>
          </div>
          <ArrowRight size={18} className="ml-auto text-gray-300 group-hover:text-brand-navy transition-colors" />
        </Link>

        <Link
          href="/workers"
          className="flex items-center gap-4 bg-gradient-to-br from-blue-50 to-blue-100/60 border-2 border-blue-200 rounded-2xl p-5 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-navy flex items-center justify-center flex-shrink-0">
            <Search size={22} className="text-white" />
          </div>
          <div>
            <p className="font-black text-brand-navy font-hindi text-sm">
              Workers ढूंढें / Browse All Workers
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Filter by category, location, rating & more
            </p>
          </div>
          <ArrowRight size={18} className="ml-auto text-gray-300 group-hover:text-brand-navy transition-colors" />
        </Link>
      </div>
    </div>
  );
}
