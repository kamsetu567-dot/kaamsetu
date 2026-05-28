"use client";

import { useState, useEffect } from "react";
import { Search, RefreshCw, CheckCircle, XCircle, Ban, ShieldCheck, Megaphone, MegaphoneOff, Trash2 } from "lucide-react";
import { getAllShops, approveShop, rejectShop, blockShop, unblockShop, enableShopAd, disableShopAd, deleteShop } from "@/lib/api/admin";
import { useToast } from "@/components/Toast";

const STATUS_COLORS = {
  pending:  "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
  blocked:  "bg-gray-200 text-gray-600",
};

export default function AdminShopsPage() {
  const toast = useToast();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionInProgress, setActionInProgress] = useState(null);

  function load() {
    setLoading(true);
    getAllShops({ status: statusFilter !== "all" ? statusFilter : undefined, search: search || undefined })
      .then(data => { setShops(data); setLoading(false); });
  }

  useEffect(() => { load(); }, [statusFilter]);

  async function handleAction(id, action, extra = {}) {
    if (actionInProgress) return;
    setActionInProgress(`${id}-${action}`);
    try {
      const fnMap = { approve: approveShop, reject: rejectShop, block: blockShop, unblock: unblockShop, disable_ad: disableShopAd, delete: deleteShop };
      if (action === "enable_ad") { await enableShopAd(id, 30); toast.success("Ad enabled for 30 days"); }
      else if (fnMap[action]) { await fnMap[action](id); toast.success(`Shop ${action}d`); }
      load();
    } catch (err) {
      toast.error(err?.message || "Action failed");
    } finally {
      setActionInProgress(null);
    }
  }

  const filtered = shops.filter(s =>
    !search ||
    s.shopName?.toLowerCase().includes(search.toLowerCase()) ||
    s.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
    s.mobile?.includes(search)
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-brand-navy font-hindi">Shops / Ad Runners</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage all registered shops and their advertisements</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1 text-brand-navy text-sm font-semibold hover:opacity-70 disabled:opacity-40 min-h-0">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input type="text" placeholder="Shop / Owner / Mobile खोजें"
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && load()}
            className="bg-transparent outline-none text-sm text-brand-navy placeholder:text-gray-400 w-48" />
        </div>
        <div className="flex gap-1.5">
          {["all", "pending", "approved", "rejected", "blocked"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${statusFilter === s ? "bg-brand-navy text-white" : "bg-white border border-gray-200 text-gray-500"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100 bg-brand-bg">
                {["Shop Name", "Owner / Mobile", "City", "Status", "Ad", "Ad Expiry", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-400 font-semibold text-xs whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">No shops found</td></tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-brand-bg last:border-0 transition-colors">
                    <td className="px-4 py-3 font-semibold text-brand-navy">{s.shopName ?? "—"}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 text-xs font-medium">{s.ownerName ?? "—"}</p>
                      <p className="text-gray-400 text-xs">{s.mobile ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.location?.city ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[s.status] || "bg-gray-100 text-gray-500"}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.adActive ? "bg-brand-yellow text-brand-navy" : "bg-gray-100 text-gray-400"}`}>
                        {s.adActive ? "LIVE" : "OFF"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {s.adExpiry ? new Date(s.adExpiry).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {s.status === "pending" && (
                          <>
                            <button onClick={() => handleAction(s.id, "approve")} disabled={!!actionInProgress}
                              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-40">
                              <CheckCircle size={11} /> Approve
                            </button>
                            <button onClick={() => handleAction(s.id, "reject")} disabled={!!actionInProgress}
                              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-40">
                              <XCircle size={11} /> Reject
                            </button>
                          </>
                        )}
                        {s.status === "approved" && (
                          <button onClick={() => handleAction(s.id, "block")} disabled={!!actionInProgress}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 disabled:opacity-40">
                            <Ban size={11} /> Block
                          </button>
                        )}
                        {s.status === "blocked" && (
                          <button onClick={() => handleAction(s.id, "unblock")} disabled={!!actionInProgress}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-40">
                            <ShieldCheck size={11} /> Unblock
                          </button>
                        )}
                        {s.adActive ? (
                          <button onClick={() => handleAction(s.id, "disable_ad")} disabled={!!actionInProgress}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 disabled:opacity-40">
                            <MegaphoneOff size={11} /> Stop Ad
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(s.id, "enable_ad")}
                            disabled={!!actionInProgress || !s.adCount}
                            title={!s.adCount ? "This shop hasn't submitted an ad yet" : "Run this shop's ad"}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 disabled:opacity-40 disabled:cursor-not-allowed">
                            <Megaphone size={11} /> Run Ad
                          </button>
                        )}
                        <button onClick={() => { if (confirm(`Delete ${s.shopName}? This cannot be undone.`)) handleAction(s.id, "delete"); }} disabled={!!actionInProgress}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600 disabled:opacity-40">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-50 bg-brand-bg text-xs text-gray-400">
            {filtered.length} shop{filtered.length !== 1 ? "s" : ""} · {filtered.filter(s => s.adActive).length} ads live
          </div>
        )}
      </div>
    </div>
  );
}
