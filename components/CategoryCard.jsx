import Link from "next/link";
import Image from "next/image";

export default function CategoryCard({ category }) {
  const { slug, nameEn, nameHi, image, subcategories } = category;
  const previewSubs = subcategories.slice(0, 3).join(" • ");
  return (
    <Link
      href={`/categories/${slug}`}
      className="relative overflow-hidden rounded-2xl group block h-52 md:h-56"
      aria-label={`${nameEn} — ${nameHi}`}
    >
      <Image
        src={image}
        alt={`${nameEn} services`}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
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
