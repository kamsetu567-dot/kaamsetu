"use client";

import { useEffect, useState } from "react";
import { Megaphone, Phone, Store } from "lucide-react";

// Three rendering variants:
//   banner-wide    — full-width banner (homepage, category page top)
//   banner-narrow  — compact card (client dashboard)
//   featured-card  — looks like a worker card, slotted into worker grid
//
// Renders null when there are no ads to show, so callers don't need to
// guard against empty state — the slot just disappears.
export default function AdSlot({
  variant = "banner-wide",
  category = "",
  type,           // override default: "banner" | "featured" | undefined
  limit = 1,
  perPage = 3,    // banner-wide: how many cards share one carousel page
  className = "",
}) {
  const [ads, setAds] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    const effectiveType = type || (variant === "featured-card" ? "featured" : "banner");
    if (effectiveType) params.set("type", effectiveType);
    params.set("limit", String(limit));

    fetch(`/api/ads/active?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.ads)) setAds(data.ads);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [category, type, limit, variant]);

  if (!loaded || ads.length === 0) return null;

  if (variant === "featured-card") {
    return (
      <>
        {ads.map(ad => <FeaturedAdCard key={String(ad.id)} ad={ad} />)}
      </>
    );
  }

  if (variant === "banner-narrow") {
    // One ad at a time, auto-rotating through all of them every 4s.
    return <NarrowCarousel ads={ads} className={className} />;
  }

  // banner-wide: `perPage` cards share a row; more paginate with auto-advance.
  return <WideCarousel ads={ads} className={className} perPage={perPage} />;
}

// Single-ad rotating carousel for the compact (client dashboard) slot.
function NarrowCarousel({ ads, className }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (ads.length <= 1) return;
    const id = setInterval(() => setIdx(i => (i + 1) % ads.length), 6000);
    return () => clearInterval(id);
  }, [ads.length]);

  const ad = ads[idx % ads.length];
  return (
    <div className={className}>
      <div key={idx} className="ad-fade">
        <NarrowBanner ad={ad} />
      </div>
      {ads.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Ad ${i + 1}`}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? "bg-brand-navy" : "bg-gray-300"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Wide banner carousel. Shows one ad at a time on mobile, `perPage` (default 3)
// per page on desktop — both auto-advance every 5s with clickable page dots.
function WideCarousel({ ads, className, perPage = 3 }) {
  // Responsive page size: 1 on mobile (<640px), `perPage` from sm up.
  const [pageSize, setPageSize] = useState(1);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 640px)");
    const sync = () => setPageSize(mq.matches ? perPage : 1);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [perPage]);

  const PER_PAGE = pageSize;
  const pages = Math.ceil(ads.length / PER_PAGE);
  const [page, setPage] = useState(0);

  // Keep page in range if pageSize changes (e.g. rotate device / resize).
  useEffect(() => { setPage(p => (p >= pages ? 0 : p)); }, [pages]);

  useEffect(() => {
    if (pages <= 1) return;
    const id = setInterval(() => setPage(p => (p + 1) % pages), 6000);
    return () => clearInterval(id);
  }, [pages]);

  const visible = pages > 1 ? ads.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE) : ads;
  const count = visible.length;
  const rowMaxW = count === 1 ? "max-w-md" : count === 2 ? "max-w-3xl" : "max-w-full";

  return (
    <div className={`mx-auto ${rowMaxW} ${className}`}>
      <div key={page} className="ad-fade flex flex-col sm:flex-row gap-3">
        {visible.map(ad => (
          <div key={String(ad.id)} className="flex-1 min-w-0">
            <WideBanner ad={ad} />
          </div>
        ))}
      </div>
      {pages > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              aria-label={`Ad page ${i + 1}`}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === page ? "bg-brand-navy" : "bg-gray-300"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SponsoredLabel({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-yellow/30 text-brand-navy ${className}`}>
      <Megaphone size={9} /> Sponsored
    </span>
  );
}

function WideBanner({ ad }) {
  const shop = ad.shop;
  return (
    <div className="bg-white rounded-2xl border-2 border-brand-yellow overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      {/* Hero creative — compact, fills card width, badge overlaid top-right */}
      <div className="relative w-full aspect-[16/6] bg-brand-navy">
        {ad.creative ? (
          <img
            src={ad.creative}
            alt={shop?.shopName || "Sponsored"}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Store size={36} className="text-brand-yellow" />
          </div>
        )}
        <SponsoredLabel className="absolute top-2 right-2 shadow-sm" />
      </div>

      {/* Info on the left + Call button on the right */}
      <div className="px-3 py-2.5 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-black text-brand-navy text-sm leading-tight truncate">
            {shop?.shopName || "Local Business"}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5 truncate">
            {ad.category}{shop?.city ? ` · 📍 ${shop.city}` : ""}
          </p>
        </div>
        {shop?.mobile && (
          <a
            href={`tel:+91${shop.mobile}`}
            className="flex items-center gap-1.5 bg-primary-green text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-green-700 transition-colors flex-shrink-0"
            aria-label={`Call ${shop.shopName || "shop"}`}
          >
            <Phone size={15} /> Call
          </a>
        )}
      </div>
    </div>
  );
}

function NarrowBanner({ ad }) {
  const shop = ad.shop;
  return (
    <div className="bg-white rounded-2xl border-2 border-brand-yellow p-3 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        {ad.creative ? (
          <img src={ad.creative} alt={shop?.shopName || "Sponsored"} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-brand-navy flex items-center justify-center flex-shrink-0">
            <Store size={22} className="text-brand-yellow" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <SponsoredLabel className="mb-1" />
          <p className="font-bold text-brand-navy text-sm truncate">{shop?.shopName || "Local Business"}</p>
        </div>
        {shop?.mobile && (
          <a
            href={`tel:+91${shop.mobile}`}
            className="flex items-center gap-1.5 bg-primary-green text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-green-700 transition-colors flex-shrink-0"
            aria-label={`Call ${shop.shopName || "shop"}`}
          >
            <Phone size={15} /> Call
          </a>
        )}
      </div>
    </div>
  );
}

function FeaturedAdCard({ ad }) {
  const shop = ad.shop;
  return (
    <a
      href={shop?.mobile ? `tel:+91${shop.mobile}` : "#"}
      className="bg-white rounded-2xl border-2 border-brand-yellow p-4 hover:shadow-md transition-shadow block"
    >
      <div className="flex gap-3 mb-3">
        {shop?.photo || ad.creative ? (
          <img
            src={shop?.photo || ad.creative}
            alt={shop?.shopName || "Sponsored"}
            className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-brand-yellow"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-brand-navy flex items-center justify-center flex-shrink-0 border-2 border-brand-yellow">
            <Store size={28} className="text-brand-yellow" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <SponsoredLabel className="mb-1" />
          <p className="font-bold text-brand-navy text-base truncate">{shop?.shopName || "Local Business"}</p>
          <p className="text-xs text-gray-500 truncate">{ad.category}</p>
          {shop?.city && <p className="text-xs text-gray-400 mt-0.5">📍 {shop.city}</p>}
        </div>
      </div>
      {shop?.mobile && (
        <div className="flex items-center justify-center gap-2 w-full bg-brand-navy text-white font-bold text-sm py-2.5 rounded-xl">
          <Phone size={14} /> Call Shop
        </div>
      )}
    </a>
  );
}
