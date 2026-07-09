import Link from "next/link";
import Image from "next/image";

// Map a category's tailwind `color` (e.g. "bg-orange-100 text-orange-600") to a
// vivid gradient used for the fallback tile when a category has no photo.
// Falls back to a neutral navy→slate gradient for unknown hues.
const GRADIENTS = {
  orange: "from-orange-500 to-amber-600", amber: "from-amber-500 to-orange-600",
  blue: "from-blue-500 to-indigo-600", sky: "from-sky-500 to-blue-600",
  cyan: "from-cyan-500 to-teal-600", teal: "from-teal-500 to-emerald-600",
  emerald: "from-emerald-500 to-green-600", green: "from-green-500 to-emerald-600",
  lime: "from-lime-500 to-green-600", pink: "from-pink-500 to-rose-600",
  rose: "from-rose-500 to-pink-600", fuchsia: "from-fuchsia-500 to-purple-600",
  purple: "from-purple-500 to-violet-600", violet: "from-violet-500 to-indigo-600",
  indigo: "from-indigo-500 to-blue-600", red: "from-red-500 to-rose-600",
  yellow: "from-yellow-500 to-amber-600", slate: "from-slate-500 to-slate-700",
  zinc: "from-zinc-500 to-slate-700", stone: "from-stone-500 to-stone-700",
};

function gradientFor(color = "") {
  const hue = color.match(/bg-([a-z]+)-\d+/)?.[1];
  return GRADIENTS[hue] || "from-brand-navy to-slate-700";
}

export default function CategoryCard({ category }) {
  const { slug, nameEn, nameHi, image, color, subcategories } = category;
  const previewSubs = subcategories.slice(0, 3).join(" • ");
  return (
    <Link
      href={`/categories/${slug}`}
      className="relative overflow-hidden rounded-2xl group block h-52 md:h-56"
      aria-label={`${nameEn} — ${nameHi}`}
    >
      {image ? (
        <Image
          src={image}
          alt={`${nameEn} services`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      ) : (
        // No photo → vivid gradient tile derived from the category's color.
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradientFor(color)} transition-transform duration-300 group-hover:scale-105`}
        />
      )}
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      {/* Text */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-black text-xl leading-tight drop-shadow">{nameEn}</h3>
        <p
          className="text-white/80 text-sm mt-1 line-clamp-1"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          {previewSubs}
        </p>
      </div>
      {/* Hover border */}
      <div className="absolute inset-0 border-4 border-transparent group-hover:border-accent-yellow rounded-2xl transition-colors duration-200 pointer-events-none" />
    </Link>
  );
}
