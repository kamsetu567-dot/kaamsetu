"use client";

import { useState, useEffect } from "react";
import { Search, Phone, CheckCircle, XCircle, MapPin, Clock, RefreshCw } from "lucide-react";
import { useToast } from "@/components/Toast";

const STATUS_CONFIG = {
  pending:   { bg: "bg-yellow-100 text-yellow-700", label: "Pending" },
  accepted:  { bg: "bg-green-100 text-green-700",   label: "Accepted" },
  completed: { bg: "bg-blue-100 text-blue-700",     label: "Completed" },
  cancelled: { bg: "bg-red-100 text-red-600",       label: "Cancelled" },
  rejected:  { bg: "bg-red-100 text-red-600",       label: "Rejected" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`${cfg.bg} text-xs font-semibold px-2.5 py-1 rounded-full capitalize`}>
      {cfg.label}
    </span>
  );
}

function getAdminToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("kaamsetu_admin_token") || "";
}

export default function AdminPendingRequestsPage() {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actionInProgress, setActionInProgress] = useState(null);

  async function loadRequests() {
    setLoading(true);
    try {
      const token = getAdminToken();
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/jobs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { console.error("Failed:", data.message); setRequests([]); return; }
      setRequests(data.jobs || []);
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRequests(); }, [statusFilter]);

  async function handleUpdateStatus(jobId, newStatus) {
    if (actionInProgress) return;
    setActionInProgress(jobId);
    try {
      const token = getAdminToken();
      const res = await fetch(`/api/admin/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || "Update failed"); return; }
      toast.success(`Request ${newStatus}!`);
      await loadRequests();
    } catch { toast.error("Action failed"); }
    finally { setActionInProgress(null); }
  }

  const filtered = requests.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.clientName || "").toLowerCase().includes(q) ||
           (r.clientMobile || "").includes(q) ||
           (r.category || "").toLowerCase().includes(q) ||
           (r.city || r.location?.city || "").toLowerCase().includes(q);
  });

  const counts = {
    total: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    accepted: requests.filter(r => r.status === "accepted").length,
    completed: requests.filter(r => r.status === "completed").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-brand-navy font-hindi">Pending Requests</h1>
          <p className="text-gray-400 text-sm">Service requests from clients</p>
        </div>
        <button onClick={loadRequests} disabled={loading}
          className="flex items-center gap-1 text-brand-navy text-sm font-semibold hover:opacity-70 disabled:opacity-40 min-h-0">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",     value: counts.total,     bg: "bg-brand-navy text-white" },
          { label: "Pending",   value: counts.pending,   bg: "bg-yellow-100 text-yellow-700" },
          { label: "Accepted",  value: counts.accepted,  bg: "bg-green-100 text-green-700" },
          { label: "Completed", value: counts.completed, bg: "bg-blue-100 text-blue-700" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <p className="text-2xl font-black">{s.value}</p>
            <p className="text-sm font-semibold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, mobile, category, city..."
            className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-sm bg-white">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 font-semibold">No requests found</p>
          <p className="text-gray-300 text-sm mt-1">Try changing the filter or refresh</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const locationCity = req.city || req.location?.city || "";
            const locationArea = req.area || req.location?.address || "";

            return (
              <div key={req._id || req.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-brand-navy">{req.clientName || "—"}</p>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-gray-400 text-sm flex items-center gap-1">
                      <Phone size={12} /> {req.clientMobile || "—"}
                    </p>
                  </div>
                  <div className="text-xs text-gray-300 flex items-center gap-1">
                    <Clock size={12} />
                    {req.createdAt
                      ? new Date(req.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                      : "—"}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm mb-3">
                  <span className="font-semibold text-brand-navy">{req.subcategory || req.category || "—"}</span>
                  {(locationCity || locationArea) && (
                    <span className="flex items-center gap-1 text-gray-400">
                      <MapPin size={12} />
                      {[locationCity, locationArea].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>

                {req.description && (
                  <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3 font-hindi">
                    "{req.description}"
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  {req.status === "pending" && (
                    <>
                      <button onClick={() => handleUpdateStatus(req._id || req.id, "accepted")}
                        disabled={actionInProgress === (req._id || req.id)}
                        className="flex items-center gap-1 bg-green-100 text-green-700 hover:bg-green-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                        <CheckCircle size={12} /> Accept
                      </button>
                      <button onClick={() => handleUpdateStatus(req._id || req.id, "cancelled")}
                        disabled={actionInProgress === (req._id || req.id)}
                        className="flex items-center gap-1 bg-red-100 text-red-600 hover:bg-red-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                        <XCircle size={12} /> Cancel
                      </button>
                    </>
                  )}
                  {req.status === "accepted" && (
                    <button onClick={() => handleUpdateStatus(req._id || req.id, "completed")}
                      disabled={actionInProgress === (req._id || req.id)}
                      className="flex items-center gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                      <CheckCircle size={12} /> Mark Completed
                    </button>
                  )}
                  {req.clientMobile && (
                    <a href={`tel:${req.clientMobile}`}
                      className="flex items-center gap-1 bg-brand-navy/10 text-brand-navy hover:bg-brand-navy/20 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                      <Phone size={12} /> Call Client
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
