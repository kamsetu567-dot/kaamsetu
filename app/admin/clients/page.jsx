"use client";

import { useState, useEffect } from "react";
import { Ban, Search, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { getAllClients, blockUser, unblockClient, deleteClient } from "@/lib/api/admin";
import { useToast } from "@/components/Toast";
import { useT } from "@/lib/i18n/useT";

export default function AdminClientsPage() {
  const toast = useToast();
  const t = useT();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionInProgress, setActionInProgress] = useState(null);

  function load() {
    setLoading(true);
    getAllClients({ limit: 2000 }).then(data => { setClients(data); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  async function handleAction(id, action) {
    if (actionInProgress) return;
    setActionInProgress(`${id}-${action}`);
    try {
      if (action === "block") { await blockUser(id, "client"); toast.success(t({ hi: 'क्लाइंट ब्लॉक किया गया।', en: 'Client blocked.' })); }
      else if (action === "unblock") { await unblockClient(id); toast.success(t({ hi: 'क्लाइंट अनब्लॉक किया गया।', en: 'Client unblocked.' })); }
      else if (action === "delete") { await deleteClient(id); toast.success(t({ hi: 'क्लाइंट डिलीट किया गया।', en: 'Client deleted.' })); }
      load();
    } catch (err) {
      toast.error(err?.message || t({ hi: 'कार्रवाई विफल', en: 'Action failed' }));
    } finally {
      setActionInProgress(null);
    }
  }

  const filtered = clients.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile?.includes(search)
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-brand-navy font-hindi">{t({ hi: 'क्लाइंट प्रबंधन', en: 'Client Management' })}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{t({ hi: 'सभी क्लाइंट देखें और उनकी एक्सेस मैनेज करें', en: 'View all clients and manage their access' })}</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1 text-brand-navy text-sm font-semibold hover:opacity-70 disabled:opacity-40 min-h-0">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> {t({ hi: 'रिफ्रेश', en: 'Refresh' })}
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 max-w-sm shadow-sm">
        <Search size={16} className="text-gray-400 flex-shrink-0" />
        <input type="text" placeholder={t({ hi: 'नाम या मोबाइल खोजें', en: 'Search by name or mobile' })}
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm text-brand-navy placeholder:text-gray-400" />
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-100 bg-brand-bg">
                {[
                  t({ hi: 'नाम', en: 'Name' }),
                  t({ hi: 'मोबाइल', en: 'Mobile' }),
                  t({ hi: 'शहर', en: 'City' }),
                  t({ hi: 'स्टेटस', en: 'Status' }),
                  t({ hi: 'रिक्वेस्ट्स', en: 'Requests' }),
                  t({ hi: 'जुड़ने की तारीख़', en: 'Joined' }),
                  t({ hi: 'कार्रवाई', en: 'Actions' }),
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
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">{t({ hi: 'कोई क्लाइंट नहीं मिला', en: 'No clients found' })}</td></tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-brand-bg last:border-0 transition-colors">
                    <td className="px-4 py-3 font-semibold text-brand-navy">{c.name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{c.mobile ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{c.location?.city ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${c.status === "blocked" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                        {c.status ?? "active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.totalRequests ?? 0}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {c.status === "blocked" ? (
                          <button onClick={() => handleAction(c.id, "unblock")} disabled={!!actionInProgress}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-40">
                            <ShieldCheck size={12} /> {t({ hi: 'अनब्लॉक', en: 'Unblock' })}
                          </button>
                        ) : (
                          <button onClick={() => handleAction(c.id, "block")} disabled={!!actionInProgress}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors disabled:opacity-40">
                            <Ban size={12} /> {t({ hi: 'ब्लॉक', en: 'Block' })}
                          </button>
                        )}
                        <button onClick={() => { if (confirm(t({ hi: `${c.name} को डिलीट करें? यह वापस नहीं किया जा सकता।`, en: `Delete ${c.name}? This cannot be undone.` }))) handleAction(c.id, "delete"); }} disabled={!!actionInProgress}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors disabled:opacity-40">
                          <Trash2 size={12} />
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
            {t({
              hi: `${filtered.length} क्लाइंट दिखाए जा रहे हैं · ${filtered.filter(c => c.status === 'blocked').length} ब्लॉक्ड`,
              en: `${filtered.length} client${filtered.length !== 1 ? 's' : ''} shown · ${filtered.filter(c => c.status === 'blocked').length} blocked`,
            })}
          </div>
        )}
      </div>
    </div>
  );
}
