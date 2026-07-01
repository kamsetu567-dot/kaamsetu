"use client";

import { useEffect, useRef, useState } from "react";
import { Megaphone, Phone, Store, ChevronLeft, ChevronRight } from "lucide-react";

// Fire-and-forget ad analytics beacon. Uses sendBeacon when available so it
// survives navigation (e.g. the tel: dialer opening on click) and never
// blocks render; falls back to keepalive fetch. Failures are ignored — a
// dropped beacon must never affect the page.
function trackAd(adId, event) {
  if (!adId) return;
  const url = `/api/ads/${adId}/track`;
  const body = JSON.stringify({ event });
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      return;
    }
  } catch { /* fall through to fetch */ }
  try {
    fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch { /* ignore */ }
}

// Module-level set of ad ids that have already logged an impression this page
// load. The wide-carousel duplicates the ad array ([...ads, ...ads]) for a
// seamless marquee, so without this each ad would double-count on render.
const impressed = new Set();

function trackImpressionOnce(adId) {
  if (!adId || impressed.has(adId)) return;
  impressed.add(adId);
  trackAd(adId, "impression");
}

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
  heading,        // optional heading shown above the slot (only when ads exist)
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
        if (data.success && Array.isArray(data.ads)) {
          setAds(data.ads);
          // Count one impression per unique ad that will actually render.
          data.ads.forEach(ad => trackImpressionOnce(String(ad.id)));
        }
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

  const headingEl = heading ? (
    <div className="text-center mb-4">
      <h2 className="text-2xl md:text-3xl font-black text-brand-navy font-hindi">{heading}</h2>
    </div>
  ) : null;

  if (variant === "banner-narrow") {
    // One ad at a time, auto-rotating through all of them every 4s.
    return (
      <div>
        {headingEl}
        <NarrowCarousel ads={ads} className={className} />
      </div>
    );
  }

  // banner-wide: continuous R→L marquee of cards with side arrows.
  return (
    <div>
      {headingEl}
      <WideCarousel ads={ads} className={className} />
    </div>
  );
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
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Ad ${i + 1}`}
              className={`dot-indicator w-1.5 shrink-0 transition-colors ${i === idx ? "bg-brand-navy" : "bg-gray-300"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Wide banner carousel — a continuous marquee that slides the ad cards
// right-to-left forever. Hover pauses; left/right arrows nudge by one card.
// Desktop shows ~3 cards across; mobile shows ~1. Single ad just renders
// static (no marquee). No dots.
const CARD_GAP = 12; // px, matches the gap-3 below

function WideCarousel({ ads, className }) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const offsetRef = useRef(0);          // current translateX in px (negative)
  const pausedRef = useRef(false);
  const halfWidthRef = useRef(0);       // width of one full set (for seamless wrap)
  const [cardW, setCardW] = useState(320);

  // A single ad doesn't need a marquee.
  const single = ads.length <= 1;

  // Responsive card width: ~1 card on mobile, ~3 across on desktop.
  useEffect(() => {
    if (single) return;
    function measure() {
      const vw = viewportRef.current?.clientWidth || 0;
      // <640px: one card fills the viewport; from sm up: 3 across.
      const perView = vw >= 640 ? 3 : 1;
      const w = Math.max(200, Math.floor((vw - CARD_GAP * (perView - 1)) / perView));
      setCardW(w);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [single]);

  // Continuous RAF-driven scroll. Duplicating the list lets us wrap seamlessly:
  // once we've scrolled past one full set, reset by that width — invisible jump.
  useEffect(() => {
    if (single) return;
    let raf;
    let last = performance.now();
    const SPEED = 40; // px per second — gentle

    function tick(now) {
      const dt = (now - last) / 1000;
      last = now;
      if (!pausedRef.current && trackRef.current) {
        // recompute half-width (one set) lazily
        halfWidthRef.current = trackRef.current.scrollWidth / 2;
        offsetRef.current -= SPEED * dt;
        if (-offsetRef.current >= halfWidthRef.current) {
          offsetRef.current += halfWidthRef.current; // seamless wrap
        }
        trackRef.current.style.transform = `translateX(${offsetRef.current}px)`;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [single, cardW]);

  // Arrows nudge by one card width (with a brief smooth transition).
  function nudge(dir) {
    const track = trackRef.current;
    if (!track) return;
    const step = (cardW + CARD_GAP) * (dir === "next" ? -1 : 1);
    offsetRef.current += step;
    const half = track.scrollWidth / 2;
    if (-offsetRef.current >= half) offsetRef.current += half;
    if (offsetRef.current > 0) offsetRef.current -= half;
    track.style.transition = "transform 0.5s ease";
    track.style.transform = `translateX(${offsetRef.current}px)`;
    setTimeout(() => { if (trackRef.current) trackRef.current.style.transition = ""; }, 500);
  }

  if (single) {
    return (
      <div className={`mx-auto max-w-md ${className}`}>
        <WideBanner ad={ads[0]} />
      </div>
    );
  }

  // Duplicate the list so the loop has no visible seam.
  const loop = [...ads, ...ads];

  return (
    <div className={`relative ${className}`}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      <div ref={viewportRef} className="overflow-hidden">
        <div ref={trackRef} className="flex gap-3 will-change-transform">
          {loop.map((ad, i) => (
            <div key={`${String(ad.id)}-${i}`} style={{ width: cardW }} className="flex-shrink-0">
              <WideBanner ad={ad} />
            </div>
          ))}
        </div>
      </div>

      {/* Arrows */}
      <button
        onClick={() => nudge("prev")}
        aria-label="Previous ad"
        className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 min-h-0 rounded-full bg-white/90 border border-gray-200 shadow-md flex items-center justify-center text-brand-navy hover:bg-white transition-colors"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={() => nudge("next")}
        aria-label="Next ad"
        className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 min-h-0 rounded-full bg-white/90 border border-gray-200 shadow-md flex items-center justify-center text-brand-navy hover:bg-white transition-colors"
      >
        <ChevronRight size={18} />
      </button>
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
            onClick={() => trackAd(String(ad.id), "click")}
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
            onClick={() => trackAd(String(ad.id), "click")}
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
      onClick={() => shop?.mobile && trackAd(String(ad.id), "click")}
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
