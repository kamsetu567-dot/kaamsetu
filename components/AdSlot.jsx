"use client";

import { useEffect, useState } from "react";
import { Megaphone, Phone, MessageSquare, Store } from "lucide-react";

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
    return (
      <div className={className}>
        {ads.map(ad => <NarrowBanner key={String(ad.id)} ad={ad} />)}
      </div>
    );
  }

  return (
    <div className={className}>
      {ads.map(ad => <WideBanner key={String(ad.id)} ad={ad} />)}
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
    <a
      href={shop?.mobile ? `tel:+91${shop.mobile}` : "#"}
      className="block bg-white rounded-2xl border-2 border-brand-yellow overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="flex items-stretch">
        {ad.creative ? (
          <img
            src={ad.creative}
            alt={shop?.shopName || "Sponsored"}
            className="w-32 h-28 sm:w-44 sm:h-32 object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-32 sm:w-44 bg-brand-navy flex items-center justify-center flex-shrink-0">
            <Store size={36} className="text-brand-yellow" />
          </div>
        )}
        <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <SponsoredLabel />
              {shop?.city && <span className="text-xs text-gray-500">📍 {shop.city}</span>}
            </div>
            <p className="font-black text-brand-navy text-base sm:text-lg leading-tight truncate">
              {shop?.shopName || "Local Business"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{ad.category}</p>
          </div>
          {shop?.mobile && (
            <div className="flex gap-2 mt-2">
              <span className="inline-flex items-center gap-1 bg-primary-green text-white text-xs font-bold px-2.5 py-1.5 rounded-lg">
                <Phone size={12} /> Call
              </span>
              <span className="inline-flex items-center gap-1 bg-[#25D366] text-white text-xs font-bold px-2.5 py-1.5 rounded-lg">
                <MessageSquare size={12} /> WhatsApp
              </span>
            </div>
          )}
        </div>
      </div>
    </a>
  );
}

function NarrowBanner({ ad }) {
  const shop = ad.shop;
  return (
    <a
      href={shop?.mobile ? `tel:+91${shop.mobile}` : "#"}
      className="block bg-white rounded-2xl border-2 border-brand-yellow p-3 hover:shadow-md transition-shadow"
    >
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
          <p className="text-xs text-gray-500 truncate">{ad.category}{shop?.city ? ` · ${shop.city}` : ""}</p>
        </div>
      </div>
    </a>
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
