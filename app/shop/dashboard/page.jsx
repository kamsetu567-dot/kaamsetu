"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Megaphone, TrendingUp, MousePointerClick, Eye,
  PlusCircle, Store, AlertCircle, CheckCircle,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton, { StatCardSkeleton } from "@/components/LoadingSkeleton";
import { useRoleGuard } from "@/lib/auth/useRoleGuard";

function ShopStat({ icon: Icon, hi, en, value, color }) {
  const styles = {
    navy:   "bg-blue-50 border-blue-100 text-brand-navy",
    orange: "bg-orange-50 border-orange-100 text-orange-500",
    green:  "bg-green-50 border-green-100 text-green-600",
    yellow: "bg-yellow-50 border-yellow-100 text-yellow-700",
  };
  const iconBg = {
    navy:   "bg-brand-navy",
    orange: "bg-orange-500",
    green:  "bg-green-600",
    yellow: "bg-brand-yellow",
  };
  return (
    <div className={`rounded-2xl border-2 p-5 ${styles[color] || styles.navy}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-sm opacity-80 font-hindi">{hi}</p>
          <p className="text-xs opacity-60">{en}</p>
        </div>
        <div className={`w-9 h-9 rounded-xl ${iconBg[color] || iconBg.navy} flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <p className="text-3xl font-black">{value ?? "—"}</p>
    </div>
  );
}

function AdCard({ ad }) {
  const statusStyle = {
    active:   { dot: "bg-green-600",      hi: "चालू",    bg: "bg-green-50  text-green-700  border-green-200"  },
    pending:  { dot: "bg-brand-yellow",   hi: "Pending", bg: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    rejected: { dot: "bg-red-400",        hi: "Rejected",bg: "bg-red-50    text-red-600    border-red-200"    },
    expired:  { dot: "bg-gray-400",       hi: "खत्म",   bg: "bg-gray-50   text-gray-500   border-gray-200"   },
  };
  const s = statusStyle[ad.status] || statusStyle.pending;

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-5 hover:border-brand-navy transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-brand-navy truncate">{ad.type === "banner" ? "Banner Ad" : "Featured Listing"}</p>
          <p className="text-gray-500 text-sm mt-0.5">{ad.category} · {ad.duration} days</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${s.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          <span className="font-hindi">{s.hi}</span>
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        {[
          { icon: Eye,               val: ad.impressions ?? 0, label: "Views"  },
          { icon: MousePointerClick, val: ad.clicks      ?? 0, label: "Clicks" },
          { icon: TrendingUp,        val: ad.ctr         ?? "0%", label: "CTR" },
        ].map(m => (
          <div key={m.label} className="bg-brand-bg rounded-xl py-2">
            <m.icon size={14} className="text-gray-500 mx-auto mb-0.5" />
            <p className="font-black text-brand-navy text-sm">{m.val}</p>
            <p className="text-xs text-gray-500">{m.label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          <span className="font-hindi">खत्म होगा</span>{" / Expires: "}
          <span className="font-semibold text-brand-navy">{ad.expiresAt ?? "—"}</span>
        </span>
        <span className="font-semibold text-brand-navy">₹{ad.budget ?? "—"}</span>
      </div>
    </div>
  );
}

export default function ShopDashboardPage() {
  useRoleGuard("shop");
  const [shop,    setShop]    = useState(null);
  const [ads,     setAds]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("kaamsetu_token");
      if (!token) return;
      try {
        const [shopRes, adsRes] = await Promise.all([
          fetch("/api/shop/me",  { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/shop/ads", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const [shopData, adsData] = await Promise.all([shopRes.json(), adsRes.json()]);
        if (shopData.success) setShop(shopData.shop);
        if (adsData.success)  setAds(adsData.ads || []);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const activeAds     = ads.filter(a => a.status === "active");
  const totalImpressions = ads.reduce((s, a) => s + (a.impressions || 0), 0);
  const totalClicks      = ads.reduce((s, a) => s + (a.clicks      || 0), 0);

  return (
    <div className="space-y-5">
      {/* Approval notice */}
      {shop && shop.status !== "approved" && (
        <div className="flex items-start gap-3 bg-yellow-50 border-2 border-yellow-300 rounded-3xl px-5 py-4">
          <AlertCircle size={22} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-black text-yellow-800 font-hindi">Shop Approval Pending है</p>
            <p className="text-yellow-700 text-sm font-hindi">
              Admin approval के बाद आपकी shop live होगी और ads चलेंगे।
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div>
        <h2 className="text-lg font-black text-brand-navy mb-3 font-hindi">Overview / ओवरव्यू</h2>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ShopStat icon={Megaphone}         hi="कुल Ads"    en="Total Ads"         value={ads.length}       color="navy"   />
            <ShopStat icon={CheckCircle}       hi="Active Ads" en="Live right now"    value={activeAds.length} color="green"  />
            <ShopStat icon={Eye}               hi="कुल Views"  en="Total Impressions" value={totalImpressions} color="orange" />
            <ShopStat icon={MousePointerClick} hi="कुल Clicks" en="Total Clicks"      value={totalClicks}      color="yellow" />
          </div>
        )}
      </div>

      {/* Shop profile summary */}
      <div className="bg-white rounded-3xl border-2 border-gray-200 p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-black text-brand-navy text-lg font-hindi">दुकान की जानकारी / Shop Info</h3>
            <p className="text-gray-500 text-sm">Your shop profile</p>
          </div>
          <Link href="/auth/signup/shop" className="text-brand-navy text-sm font-semibold hover:underline">
            <span className="font-hindi">संपादित करें</span>{" / Edit"}
          </Link>
        </div>
        <div className="flex gap-4 items-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0 border-2 border-gray-200 overflow-hidden">
            {shop?.photo ? (
              <img src={shop.photo} alt="Shop" className="w-full h-full object-cover" />
            ) : (
              <Store size={28} className="text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-brand-navy">{shop?.shopName || "—"}</p>
            <p className="text-gray-500 text-sm">{shop?.category || "No category"}</p>
            <p className="text-gray-400 text-xs mt-0.5">📍 {shop?.location?.city || "—"}</p>
          </div>
        </div>
        {shop?.status === "approved" && (
          <div className="mt-3 flex items-center gap-1 text-green-600 text-xs font-semibold">
            <CheckCircle size={14} /> Verified Shop
          </div>
        )}
      </div>

      {/* Active ads */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-black text-brand-navy text-lg font-hindi">मेरे Ads / My Ads</h3>
            <p className="text-gray-500 text-sm">Your advertisements</p>
          </div>
          <Link href="/shop/ads"
            className="flex items-center gap-2 bg-brand-navy text-white font-bold px-4 py-2.5 rounded-xl hover:bg-blue-900 transition-colors text-sm">
            <PlusCircle size={16} />
            <span className="font-hindi">नया Ad / New Ad</span>
          </Link>
        </div>

        {loading ? (
          <LoadingSkeleton type="card" count={2} />
        ) : ads.length === 0 ? (
          <EmptyState icon="default"
            titleHi="अभी कोई Ad नहीं" titleEn="No ads yet"
            descHi="अपना पहला ad बनाएं — हजारों customers तक पहुँचें!" descEn="Create your first ad and reach thousands of customers!"
            action={{ labelHi: "नया Ad बनाएं", labelEn: "Create New Ad", onClick: () => (window.location.href = "/shop/ads") }}
          />
        ) : (
          <div className="space-y-4">
            {ads.map(ad => <AdCard key={String(ad.id || ad._id)} ad={ad} />)}
          </div>
        )}
      </div>

      {/* Tip */}
      <div className="bg-brand-navy rounded-3xl p-5 text-white">
        <h4 className="font-black mb-1">💡 Pro Tip</h4>
        <p className="text-white/80 text-sm font-hindi">
          Banner ads आपकी category page पर दिखाए जाते हैं — ज्यादा customers आते हैं!
        </p>
        <p className="text-white/60 text-xs mt-1">
          Banner ads show on your category page — more visibility, more customers!
        </p>
      </div>
    </div>
  );
}
