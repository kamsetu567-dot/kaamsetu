"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Eye, MousePointerClick, TrendingUp, Megaphone, X } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { useT } from "@/lib/i18n/useT";

const STATUS_FILTERS = ["all", "pending", "active", "rejected", "expired"];

function AdStatusBadge({ status }) {
  // Stays as a plain map. AdminAdsPage hook-translates the displayed label via
  // useT() at render time so we don't have to call hooks here.
  const map = {
    active:   { en: "Active",   hi: "एक्टिव",   bg: "bg-green-100  text-green-700" },
    pending:  { en: "Pending",  hi: "लंबित",    bg: "bg-yellow-100 text-yellow-700" },
    rejected: { en: "Rejected", hi: "अस्वीकृत", bg: "bg-red-100    text-red-600" },
    expired:  { en: "Expired",  hi: "एक्सपायर", bg: "bg-gray-100   text-gray-500" },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.bg}`}>
      <BadgeLabel hi={s.hi} en={s.en} />
    </span>
  );
}

function BadgeLabel({ hi, en }) {
  const t = useT();
  return <>{t({ hi, en })}</>;
}

export default function AdminAdsPage() {
  const t = useT();
  const [ads,         setAds]         = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState("all");
  const [actionMap,   setActionMap]   = useState({}); // adId → "approving"|"rejecting"
  const [rejectNote,  setRejectNote]  = useState({}); // adId → string
  const [zoomSrc,     setZoomSrc]     = useState(null); // creative URL when zoom modal open

  async function loadAds(status) {
    setLoading(true);
    try {
      const token = localStorage.getItem("kaamsetu_admin_token");
      const q = status && status !== "all" ? `?status=${status}` : "";
      const res  = await fetch(`/api/admin/ads${q}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setAds(data.ads || []);
      } else {
        console.error("Admin ads fetch failed:", data.message);
        setAds([]);
      }
    } catch (err) {
      console.error("Admin ads network error:", err);
      setAds([]);
    }
    setLoading(false);
  }

  useEffect(() => { loadAds(filter); }, [filter]);

  async function handleAction(adId, action) {
    setActionMap(m => ({ ...m, [adId]: action === "approve" ? "approving" : "rejecting" }));
    try {
      const token = localStorage.getItem("kaamsetu_admin_token");
      const res  = await fetch(`/api/admin/ads/${adId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, reviewNote: rejectNote[adId] || "" }),
      });
      const data = await res.json();
      if (data.success) {
        setAds(prev => prev.map(a => String(a.id || a._id) === String(adId) ? { ...a, ...data.ad } : a));
      }
    } catch {}
    setActionMap(m => { const n = { ...m }; delete n[adId]; return n; });
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {zoomSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setZoomSrc(null)}
        >
          <button
            type="button"
            onClick={() => setZoomSrc(null)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label={t({ hi: 'बंद करें', en: 'Close' })}
          >
            <X size={20} />
          </button>
          <img
            src={zoomSrc}
            alt={t({ hi: 'पूरा साइज़ Ad creative', en: 'Ad creative full size' })}
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-brand-navy flex items-center gap-2">
            <Megaphone size={24} /> {t({ hi: 'ऐड प्रबंधन', en: 'Ads Management' })}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{t({ hi: 'शॉप विज्ञापन की समीक्षा और मंजूरी', en: 'Review and approve shop advertisements' })}</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(s => {
          const label = {
            all:      t({ hi: 'सभी',      en: 'All' }),
            pending:  t({ hi: 'लंबित',    en: 'Pending' }),
            active:   t({ hi: 'एक्टिव',   en: 'Active' }),
            rejected: t({ hi: 'अस्वीकृत', en: 'Rejected' }),
            expired:  t({ hi: 'एक्सपायर', en: 'Expired' }),
          }[s];
          return (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                filter === s ? "bg-brand-navy text-white" : "bg-white border-2 border-gray-200 text-gray-600 hover:border-brand-navy"
              }`}>
              {label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingSkeleton type="card" count={3} />
      ) : ads.length === 0 ? (
        <EmptyState icon="default" titleHi="कोई Ad नहीं" titleEn={`No ${filter} ads`}
          descHi="अभी कोई ad नहीं है।" descEn="No ads found for this filter." />
      ) : (
        <div className="space-y-4">
          {ads.map(ad => {
            const id = String(ad.id || ad._id);
            const busy = actionMap[id];
            return (
              <div key={id} className="bg-white rounded-2xl border-2 border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-black text-brand-navy">{ad.shopName}</p>
                      <AdStatusBadge status={ad.status} />
                    </div>
                    <p className="text-gray-500 text-sm">
                      {ad.type === "banner" ? t({ hi: 'बैनर ऐड', en: 'Banner Ad' }) : t({ hi: 'फ़ीचर्ड लिस्टिंग', en: 'Featured Listing' })} · {ad.category} · {ad.duration} {t({ hi: 'दिन', en: 'days' })} · ₹{ad.budget}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {t({ hi: 'सबमिट किया गया:', en: 'Submitted:' })} {new Date(ad.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>

                {ad.creative && (
                  <button
                    type="button"
                    onClick={() => setZoomSrc(ad.creative)}
                    className="block w-full mb-3 group"
                    aria-label={t({ hi: 'पूरा साइज़ देखें', en: 'View full-size creative' })}
                  >
                    <img
                      src={ad.creative}
                      alt={t({ hi: 'Ad creative', en: 'Ad creative' })}
                      className="w-full max-h-48 object-contain bg-gray-50 rounded-xl group-hover:opacity-90 transition-opacity"
                    />
                    <p className="text-[10px] text-gray-400 mt-1 text-center">{t({ hi: 'ज़ूम करने के लिए image पर क्लिक करें', en: 'Click image to zoom' })}</p>
                  </button>
                )}

                {/* Metrics */}
                {ad.status === "active" && (
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    {[
                      { icon: Eye,               val: ad.impressions ?? 0, label: t({ hi: 'व्यू', en: 'Views' })  },
                      { icon: MousePointerClick, val: ad.clicks      ?? 0, label: t({ hi: 'क्लिक्स', en: 'Clicks' }) },
                      { icon: TrendingUp,        val: ad.ctr         ?? "0%", label: t({ hi: 'CTR', en: 'CTR' }) },
                    ].map(m => (
                      <div key={m.label} className="bg-gray-50 rounded-xl py-2">
                        <m.icon size={13} className="text-gray-400 mx-auto mb-0.5" />
                        <p className="font-black text-brand-navy text-sm">{m.val}</p>
                        <p className="text-xs text-gray-400">{m.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {ad.reviewNote && (
                  <p className="text-red-500 text-xs mb-3 bg-red-50 rounded-lg px-3 py-2">{t({ hi: 'नोट:', en: 'Note:' })} {ad.reviewNote}</p>
                )}

                {/* Actions — only for pending */}
                {ad.status === "pending" && (
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <input
                      placeholder={t({ hi: 'अस्वीकृति का कारण (वैकल्पिक)...', en: 'Rejection reason (optional)...' })}
                      value={rejectNote[id] || ""}
                      onChange={e => setRejectNote(m => ({ ...m, [id]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-navy"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAction(id, "approve")}
                        disabled={!!busy}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-2.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 text-sm">
                        <CheckCircle size={16} />
                        {busy === "approving" ? t({ hi: 'अप्रूव हो रहा है...', en: 'Approving...' }) : t({ hi: 'अप्रूव', en: 'Approve' })}
                      </button>
                      <button
                        onClick={() => handleAction(id, "reject")}
                        disabled={!!busy}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white font-bold py-2.5 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 text-sm">
                        <XCircle size={16} />
                        {busy === "rejecting" ? t({ hi: 'अस्वीकृत हो रहा है...', en: 'Rejecting...' }) : t({ hi: 'अस्वीकार', en: 'Reject' })}
                      </button>
                    </div>
                  </div>
                )}

                {/* Active ad expiry info */}
                {ad.status === "active" && ad.expiresAt && (
                  <p className="text-xs text-gray-400 pt-3 border-t border-gray-100">
                    {t({ hi: 'एक्सपायर:', en: 'Expires:' })} <span className="font-semibold text-brand-navy">
                      {new Date(ad.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
