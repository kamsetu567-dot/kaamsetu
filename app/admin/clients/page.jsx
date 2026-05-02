"use client";

import { useState, useEffect } from "react";
import { Ban, Search } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { TableRowSkeleton } from "@/components/LoadingSkeleton";
import { getAllClients, blockUser } from "@/lib/api/admin";

export default function AdminClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getAllClients().then(data => { setClients(data); setLoading(false); });
  }, []);

  const filtered = clients.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile?.includes(search)
  );

  async function handleBlock(id) {
    await blockUser(id, "client");
    // TODO: Refresh client list from API after block
  }

  return (
    <div className="space-y-5">
      <div>
        <h1
          className="text-2xl font-black text-text-primary"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          Clients प्रबंधन / Manage Clients
        </h1>
        <p className="text-text-secondary text-sm mt-0.5">View all clients and manage their access</p>
      </div>

      <div className="flex items-center gap-2 bg-white border-2 border-border-light rounded-xl px-4 py-2.5 max-w-sm">
        <Search size={16} className="text-text-secondary flex-shrink-0" />
        <input
          type="text"
          placeholder="नाम या मोबाइल खोजें / Search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-secondary"
        />
      </div>

      <div className="bg-white rounded-3xl border-2 border-border-light overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b-2 border-border-light bg-neutral-bg">
                {["नाम / Name", "Mobile", "Requests", "Last Active", "Action"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-text-secondary font-semibold text-xs whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12">
                    <EmptyState
                      icon="default"
                      titleHi="कोई Client नहीं"
                      titleEn="No clients found"
                      descHi="अभी कोई registered client नहीं है।"
                      descEn="No registered clients yet."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="border-b border-border-light hover:bg-neutral-bg last:border-0 transition-colors">
                    <td className="px-4 py-3 font-semibold text-text-primary">{c.name ?? "—"}</td>
                    <td className="px-4 py-3 text-text-secondary">{c.mobile ?? "—"}</td>
                    <td className="px-4 py-3 text-text-secondary">{c.requestsCount ?? 0}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{c.lastActive ?? "—"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleBlock(c.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors"
                        aria-label="Block client"
                      >
                        <Ban size={12} />
                        Block
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-border-light bg-neutral-bg text-xs text-text-secondary">
            {filtered.length} client{filtered.length !== 1 ? "s" : ""} shown
          </div>
        )}
      </div>
    </div>
  );
}
