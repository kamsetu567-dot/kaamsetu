"use client";

import { useState, useEffect } from "react";
import { Ban, Search, RefreshCw } from "lucide-react";
import { getAllClients, blockUser } from "@/lib/api/admin";
import { useToast } from "@/components/Toast";

export default function AdminClientsPage() {
  const toast = useToast();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionInProgress, setActionInProgress] = useState(null);

  function load() {
    setLoading(true);
    getAllClients().then(data => { setClients(data); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  async function handleBlock(id) {
    if (actionInProgress) return;
    setActionInProgress(id);
    try {
      await blockUser(id, "client");
      toast.success("Client blocked.");
      load();
    } catch (err) {
      toast.error(err?.message || "Block failed");
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
          <h1 className="text-2xl font-black text-brand-navy font-hindi">Clients प्रबंधन</h1>
          <p className="text-gray-400 text-sm mt-0.5">View all clients and manage their access</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1 text-brand-navy text-sm font-semibold hover:opacity-70 disabled:opacity-40 min-h-0">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 max-w-sm shadow-sm">
        <Search size={16} className="text-gray-400 flex-shrink-0" />
        <input type="text" placeholder="नाम या मोबाइल खोजें"
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm text-brand-navy placeholder:text-gray-400" />
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-100 bg-brand-bg">
                {["नाम / Name", "Mobile", "City", "Requests", "Joined", "Action"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-400 font-semibold text-xs whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">No clients found</td></tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-brand-bg last:border-0 transition-colors">
                    <td className="px-4 py-3 font-semibold text-brand-navy">{c.name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{c.mobile ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{c.location?.city ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{c.totalRequests ?? 0}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleBlock(c.id)} disabled={actionInProgress === c.id}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors disabled:opacity-40">
                        <Ban size={12} /> Block
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-50 bg-brand-bg text-xs text-gray-400">
            {filtered.length} client{filtered.length !== 1 ? "s" : ""} shown
          </div>
        )}
      </div>
    </div>
  );
}
