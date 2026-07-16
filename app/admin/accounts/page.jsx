"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogIn, RefreshCw, AlertCircle, UserCheck, Users } from "lucide-react";
import { apiGet } from "@/lib/api/client";
import { impersonateAccount } from "@/lib/api/admin";
import { startImpersonation } from "@/lib/utils/impersonation";
import { useToast } from "@/components/Toast";
import Pagination, { paginate } from "@/components/Pagination";

const PER_PAGE = 20;

// Worker and Client statuses come from different enums.
const STATUS_BADGE = {
  approved: "bg-green-100 text-green-700",
  active: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-600",
  blocked: "bg-red-100 text-red-600",
  deactivated: "bg-gray-100 text-gray-600",
};

export default function AdminAccountsPage() {
  const toast = useToast();
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(null);

  useEffect(() => { setPage(1); }, [search, typeFilter]);
  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      // Called directly rather than via getAllWorkers/getAllClients: those
      // swallow errors and return [], which would render "no accounts" on a
      // failure and look like an empty database.
      const [w, c] = await Promise.all([
        apiGet("/api/admin/workers", { limit: 2000 }),
        apiGet("/api/admin/clients", { limit: 2000 }),
      ]);
      const workers = (w.workers || []).map(x => ({
        key: `worker-${x.id}`, type: "worker", id: x.id,
        name: x.name, mobile: x.mobile,
        city: x.city || "",              // workers API flattens location.city
        status: x.status, extra: x.category || "", createdAt: x.createdAt,
      }));
      const clients = (c.clients || []).map(x => ({
        key: `client-${x.id}`, type: "client", id: x.id,
        name: x.name, mobile: x.mobile,
        city: x.location?.city || "",    // clients API returns the nested object
        status: x.status, extra: `${x.totalRequests || 0} requests`, createdAt: x.createdAt,
      }));
      setRows([...workers, ...clients].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      ));
    } catch (err) {
      setLoadError(err?.message || "Could not load accounts");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleLoginAs(row) {
    if (busy) return;   // guards the double-click window around the await below
    if (!confirm(
      `Log in as ${row.name || row.mobile} (${row.type})?\n\n` +
      `Your admin session will be paused and restored when you tap Exit.`
    )) return;
    setBusy(row.key);
    try {
      const data = await impersonateAccount(row.type, row.id);
      const ok = startImpersonation({
        token: data.token,
        user: data.user,
        meta: { name: data.user?.name || row.name || row.mobile, type: row.type },
      });
      if (!ok) {
        toast.error("Could not switch session. Please re-login to admin and try again.");
        setBusy(null);
        return;
      }
      // Hard navigation: forces a clean remount so every page reads the new
      // session from localStorage instead of keeping admin-era state.
      window.location.href = data.redirectTo;
    } catch (err) {
      toast.error(err?.message || "Login as user failed");
      setBusy(null);
    }
  }

  const filtered = rows.filter(r => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || r.name?.toLowerCase().includes(q) || r.mobile?.includes(q) || r.city?.toLowerCase().includes(q);
    const matchType = typeFilter === "all" || r.type === typeFilter;
    return matchSearch && matchType;
  });
  const { pageItems, pageProps } = paginate(filtered, page, PER_PAGE);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-brand-navy font-hindi">अकाउंट्स / Accounts</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            All workers and clients — log in as any account to see exactly what they see.
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 border-2 border-gray-200 text-gray-600 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-gray-50 disabled:opacity-50">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search name, mobile or city…"
          className="flex-1 min-w-[220px] border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-navy" />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-navy">
          <option value="all">All accounts</option>
          <option value="worker">Workers only</option>
          <option value="client">Clients only</option>
        </select>
      </div>

      {loadError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-700 text-sm">Could not load accounts</p>
            <p className="text-red-600 text-xs mt-1">{loadError}</p>
          </div>
          <button onClick={load} className="bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-lg">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-3xl border-2 border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-bg">
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  {loadError ? "—" : "No accounts found"}
                </td></tr>
              ) : pageItems.map(r => (
                <tr key={r.key} className="border-b border-gray-50 hover:bg-brand-bg last:border-0 transition-colors">
                  <td className="px-4 py-3 font-semibold text-brand-navy">{r.name || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{r.mobile || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      r.type === "worker" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                    }`}>
                      {r.type === "worker" ? <UserCheck size={11} /> : <Users size={11} />}
                      {r.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {r.city || <span className="text-red-500 text-xs font-semibold">no city</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[r.status] || "bg-gray-100 text-gray-600"}`}>
                      {r.status || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleLoginAs(r)} disabled={!!busy}
                      className="flex items-center gap-1.5 text-xs font-bold bg-brand-navy text-white px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50 whitespace-nowrap">
                      <LogIn size={12} /> {busy === r.key ? "Opening…" : "Login as"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && filtered.length > 0 && (
        <Pagination {...pageProps} onPageChange={setPage} />
      )}
    </div>
  );
}
