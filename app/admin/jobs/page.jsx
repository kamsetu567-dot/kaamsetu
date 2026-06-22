"use client";

import { useState, useEffect } from "react";
import { Search, RefreshCw } from "lucide-react";
import { getAllJobs } from "@/lib/api/admin";
import { useT } from "@/lib/i18n/useT";

const STATUS_BADGE = {
  pending:   "bg-yellow-100 text-yellow-700",
  open:      "bg-blue-100 text-blue-700",
  accepted:  "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-600",
  rejected:  "bg-red-100 text-red-600",
};

export default function AdminJobsPage() {
  const t = useT();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  function load() {
    setLoading(true);
    getAllJobs().then(data => { setJobs(data); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  const q = search.toLowerCase();
  const filtered = jobs.filter(j => {
    const matchStatus = statusFilter === "all" || j.status === statusFilter;
    const matchSearch = !search ||
      j.clientName?.toLowerCase().includes(q) ||
      j.clientMobile?.includes(q) ||
      j.category?.toLowerCase().includes(q) ||
      (j.city || j.location?.city || "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-brand-navy font-hindi">{t({ hi: 'सभी जॉब्स', en: 'Jobs' })}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{t({ hi: 'प्लेटफ़ॉर्म पर सभी जॉब रिक्वेस्ट', en: 'All job requests across the platform' })}</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1 text-brand-navy text-sm font-semibold hover:opacity-70 disabled:opacity-40 min-h-0">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> {t({ hi: 'रिफ्रेश', en: 'Refresh' })}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex-1 max-w-sm shadow-sm">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input type="text" placeholder={t({ hi: 'क्लाइंट का नाम, मोबाइल, कैटेगरी, शहर...', en: 'Client name, mobile, category, city...' })}
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-sm bg-white shadow-sm">
          <option value="all">{t({ hi: 'सभी स्टेटस', en: 'All Status' })}</option>
          <option value="pending">{t({ hi: 'लंबित', en: 'Pending' })}</option>
          <option value="accepted">{t({ hi: 'स्वीकार', en: 'Accepted' })}</option>
          <option value="completed">{t({ hi: 'पूरी हुई', en: 'Completed' })}</option>
          <option value="cancelled">{t({ hi: 'रद्द', en: 'Cancelled' })}</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100 bg-brand-bg">
                {[
                  t({ hi: 'जॉब आईडी', en: 'Job ID' }),
                  t({ hi: 'क्लाइंट', en: 'Client' }),
                  t({ hi: 'कैटेगरी', en: 'Category' }),
                  t({ hi: 'शहर', en: 'City' }),
                  t({ hi: 'स्टेटस', en: 'Status' }),
                  t({ hi: 'दिनांक', en: 'Date' }),
                  t({ hi: 'सोर्स', en: 'Source' }),
                ].map(h => (
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
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">{t({ hi: 'कोई जॉब नहीं मिली', en: 'No jobs found' })}</td></tr>
              ) : (
                filtered.map(j => (
                  <tr key={j._id || j.id} className="border-b border-gray-50 hover:bg-brand-bg last:border-0 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400 truncate max-w-[90px]">
                      {String(j._id || j.id).slice(-8)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-brand-navy">{j.clientName ?? "—"}</p>
                      <p className="text-xs text-gray-400">{j.clientMobile ?? ""}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{j.subcategory || j.category || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{j.city || j.location?.city || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[j.status] || STATUS_BADGE.pending}`}>
                        {j.status ?? "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {j.createdAt ? new Date(j.createdAt).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-400 capitalize text-xs">{j.source ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-50 bg-brand-bg text-xs text-gray-400">
            {t({ hi: `${filtered.length} जॉब्स दिखाई जा रही हैं`, en: `${filtered.length} job${filtered.length !== 1 ? 's' : ''} shown` })}
          </div>
        )}
      </div>
    </div>
  );
}
