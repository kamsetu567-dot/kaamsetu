"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Eye, MousePointerClick, TrendingUp, Megaphone } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";

const STATUS_FILTERS = ["all", "pending", "active", "rejected", "expired"];

function AdStatusBadge({ status }) {
  const map = {
    active:   { hi: "Active",   bg: "bg-green-100  text-green-700" },
    pending:  { hi: "Pending",  bg: "bg-yellow-100 text-yellow-700" },
    rejected: { hi: "Rejected", bg: "bg-red-100    text-red-600" },
    expired:  { hi: "Expired",  bg: "bg-gray-100   text-gray-500" },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.bg}`}>{s.hi}</span>
  );
}

export default function AdminAdsPage() {
  const [ads,         setAds]         = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState("all");
  const [actionMap,   setActionMap]   = useState({}); // adId → "approving"|"rejecting"
  const [rejectNote,  setRejectNote]  = useState({}); // adId → string

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-brand-navy flex items-center gap-2">
            <Megaphone size={24} /> Ads Management
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Review and approve shop advertisements</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors capitalize ${
              filter === s ? "bg-brand-navy text-white" : "bg-white border-2 border-gray-200 text-gray-600 hover:border-brand-navy"
            }`}>
            {s}
          </button>
        ))}
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
              <div key={id} className="bg-white rounded-2xl border-2 border-gray-200 p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-black text-brand-navy">{ad.shopName}</p>
                      <AdStatusBadge status={ad.status} />
                    </div>
                    <p className="text-gray-500 text-sm">
                      {ad.type === "banner" ? "Banner Ad" : "Featured Listing"} · {ad.category} · {ad.duration} days · ₹{ad.budget}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Submitted: {new Date(ad.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>

                {ad.creative && (
                  <img src={ad.creative} alt="Ad creative" className="w-full h-36 object-cover rounded-xl mb-3" />
                )}

                {/* Metrics */}
                {ad.status === "active" && (
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    {[
                      { icon: Eye,               val: ad.impressions ?? 0, label: "Views"  },
                      { icon: MousePointerClick, val: ad.clicks      ?? 0, label: "Clicks" },
                      { icon: TrendingUp,        val: ad.ctr         ?? "0%", label: "CTR" },
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
                  <p className="text-red-500 text-xs mb-3 bg-red-50 rounded-lg px-3 py-2">Note: {ad.reviewNote}</p>
                )}

                {/* Actions — only for pending */}
                {ad.status === "pending" && (
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <input
                      placeholder="Rejection reason (optional)..."
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
                        {busy === "approving" ? "Approving..." : "Approve"}
                      </button>
                      <button
                        onClick={() => handleAction(id, "reject")}
                        disabled={!!busy}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white font-bold py-2.5 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 text-sm">
                        <XCircle size={16} />
                        {busy === "rejecting" ? "Rejecting..." : "Reject"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Active ad expiry info */}
                {ad.status === "active" && ad.expiresAt && (
                  <p className="text-xs text-gray-400 pt-3 border-t border-gray-100">
                    Expires: <span className="font-semibold text-brand-navy">{ad.expiresAt}</span>
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
