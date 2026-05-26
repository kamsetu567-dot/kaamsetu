"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle, XCircle, ShieldOff, ShieldCheck,
  Ban, Star, CalendarCheck, Search, RefreshCw, IdCard, X,
} from "lucide-react";
import { getAllWorkers, approveWorker, rejectWorker, activateWorker, deactivateWorker, blockUser, boostWorker, extendWorkerSubscription } from "@/lib/api/admin";
import { useToast } from "@/components/Toast";

const STATUS_BADGE = {
  pending:     "bg-yellow-100 text-yellow-700",
  approved:    "bg-green-100 text-green-700",
  rejected:    "bg-red-100 text-red-600",
  blocked:     "bg-gray-100 text-gray-600",
  deactivated: "bg-orange-100 text-orange-600",
};

function ActionBtn({ label, onClick, color = "blue", icon: Icon, disabled = false }) {
  const cls = {
    green:  "bg-green-100 text-green-700 hover:bg-green-200",
    red:    "bg-red-100 text-red-600 hover:bg-red-200",
    yellow: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
    blue:   "bg-blue-100 text-blue-700 hover:bg-blue-200",
    gray:   "bg-gray-100 text-gray-600 hover:bg-gray-200",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${cls[color]}`}>
      {Icon && <Icon size={12} />}
      {label}
    </button>
  );
}

function AadharModal({ worker, onClose }) {
  if (!worker) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-black text-brand-navy text-lg">{worker.name}</h3>
            <p className="text-gray-400 text-sm">📞 {worker.mobile} · {worker.city || "—"}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 min-h-0"><X size={22} /></button>
        </div>

        {worker.aadharNumber && (
          <div className="bg-gray-50 rounded-xl px-4 py-2 mb-4">
            <p className="text-xs text-gray-500">Aadhar Number</p>
            <p className="font-black text-brand-navy tracking-widest text-lg">{worker.aadharNumber}</p>
          </div>
        )}

        <div className="space-y-3">
          {worker.aadharFrontUrl ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">Aadhar Front</p>
              <img src={worker.aadharFrontUrl} alt="Aadhar Front" className="w-full rounded-xl border border-gray-200 object-contain max-h-52" />
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No Aadhar front photo uploaded</p>
          )}
          {worker.aadharBackUrl && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">Aadhar Back</p>
              <img src={worker.aadharBackUrl} alt="Aadhar Back" className="w-full rounded-xl border border-gray-200 object-contain max-h-52" />
            </div>
          )}
        </div>

        {worker.photo && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-500 mb-1.5">Profile Photo</p>
            <img src={worker.photo} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-brand-navy mx-auto" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminWorkersPage() {
  const toast = useToast();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionInProgress, setActionInProgress] = useState(null);
  const [aadharWorker, setAadharWorker] = useState(null);

  function load() {
    setLoading(true);
    getAllWorkers().then(data => { setWorkers(data); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  async function handleAction(action, id) {
    const fns = { approve: approveWorker, reject: rejectWorker, activate: activateWorker, deactivate: deactivateWorker };
    if (!fns[action] || actionInProgress) return;
    setActionInProgress(`${action}-${id}`);
    try {
      await fns[action](id);
      load();
      const labels = { approve: "Approved", reject: "Rejected", activate: "Activated", deactivate: "Deactivated" };
      toast.success(`Worker ${labels[action] || action}!`);
    } catch (err) {
      toast.error(err?.message || "Action failed");
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleBlock(id) {
    if (actionInProgress) return;
    setActionInProgress(`block-${id}`);
    try {
      await blockUser(id, "worker");
      load();
      toast.success("Worker blocked.");
    } catch (err) { toast.error(err?.message || "Block failed"); }
    finally { setActionInProgress(null); }
  }

  async function handleBoost(id) {
    if (actionInProgress) return;
    setActionInProgress(`boost-${id}`);
    try {
      await boostWorker(id);
      load();
      toast.success("Worker boosted for 7 days!");
    } catch (err) { toast.error(err?.message || "Boost failed"); }
    finally { setActionInProgress(null); }
  }

  async function handleExtend(id) {
    if (actionInProgress) return;
    setActionInProgress(`extend-${id}`);
    try {
      await extendWorkerSubscription(id);
      load();
      toast.success("Subscription extended by 30 days.");
    } catch (err) { toast.error(err?.message || "Extension failed"); }
    finally { setActionInProgress(null); }
  }

  const filtered = workers.filter(w => {
    const matchSearch = !search || w.name?.toLowerCase().includes(search.toLowerCase()) || w.mobile?.includes(search);
    const matchStatus = statusFilter === "all" || w.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = workers.filter(w => w.status === "pending").length;

  return (
    <div className="space-y-5">
      <AadharModal worker={aadharWorker} onClose={() => setAadharWorker(null)} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-brand-navy font-hindi">
            Workers प्रबंधन
            {pendingCount > 0 && (
              <span className="ml-2 bg-yellow-400 text-brand-navy text-sm font-bold px-2 py-0.5 rounded-full">{pendingCount} pending</span>
            )}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">Approve, activate, block, and manage all workers</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1 text-brand-navy text-sm font-semibold hover:opacity-70 disabled:opacity-40 min-h-0">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex-1 min-w-48 shadow-sm">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input type="text" placeholder="Search name or mobile..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-brand-navy placeholder:text-gray-400" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-sm bg-white shadow-sm">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="deactivated">Deactivated</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100 bg-brand-bg">
                {["Name", "Mobile", "Category", "Gender", "Service", "Status", "Work", "Rating", "Sub Expiry", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-400 font-semibold text-xs whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="py-12 text-center text-gray-400">No workers found</td></tr>
              ) : (
                filtered.map(w => (
                  <tr key={w.id} className="border-b border-gray-50 hover:bg-brand-bg last:border-0 transition-colors">
                    <td className="px-4 py-3 font-semibold text-brand-navy">{w.name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{w.mobile ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{w.category ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{w.gender ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{w.serviceType ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[w.status] ?? STATUS_BADGE.pending}`}>
                        {w.status ?? "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${w.workStatus === "working" ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-700"}`}>
                        {w.workStatus === "working" ? "व्यस्त" : "खाली"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-brand-navy">{w.rating ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {w.subscriptionExpiry ? new Date(w.subscriptionExpiry).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {w.status === "pending" && (
                          <>
                            <ActionBtn label="Approve" icon={CheckCircle} color="green" onClick={() => handleAction("approve", w.id)} disabled={!!actionInProgress} />
                            <ActionBtn label="Reject"  icon={XCircle}     color="red"   onClick={() => handleAction("reject",  w.id)} disabled={!!actionInProgress} />
                          </>
                        )}
                        {w.status === "approved" && (
                          <ActionBtn label="Deactivate" icon={ShieldOff} color="yellow" onClick={() => handleAction("deactivate", w.id)} disabled={!!actionInProgress} />
                        )}
                        {(w.status === "rejected" || w.status === "deactivated") && (
                          <ActionBtn label="Activate" icon={ShieldCheck} color="green" onClick={() => handleAction("activate", w.id)} disabled={!!actionInProgress} />
                        )}
                        <ActionBtn label="Aadhar"  icon={IdCard}        color="blue" onClick={() => setAadharWorker(w)} disabled={!!actionInProgress} />
                        <ActionBtn label="Block"   icon={Ban}          color="gray" onClick={() => handleBlock(w.id)}  disabled={!!actionInProgress} />
                        <ActionBtn label="Boost ⭐" icon={Star}         color="blue" onClick={() => handleBoost(w.id)}  disabled={!!actionInProgress} />
                        <ActionBtn label="Extend"  icon={CalendarCheck} color="blue" onClick={() => handleExtend(w.id)} disabled={!!actionInProgress} />
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
            {filtered.length} worker{filtered.length !== 1 ? "s" : ""} shown
          </div>
        )}
      </div>
    </div>
  );
}
