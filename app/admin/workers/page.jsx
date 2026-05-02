"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle, XCircle, ShieldOff, ShieldCheck,
  Ban, Star, CalendarCheck, UserCheck, Search, Filter,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { TableRowSkeleton } from "@/components/LoadingSkeleton";
import { getAllWorkers, approveWorker, rejectWorker, activateWorker, deactivateWorker, blockUser } from "@/lib/api/admin";

const STATUS_BADGE = {
  pending:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  approved:  "bg-green-100 text-green-700 border-green-200",
  rejected:  "bg-red-100 text-red-600 border-red-200",
  blocked:   "bg-gray-100 text-gray-600 border-gray-200",
};

const WORK_BADGE = {
  free:    "bg-green-50 text-primary-green",
  working: "bg-orange-50 text-working-orange",
};

function ActionBtn({ label, onClick, color = "blue", icon: Icon }) {
  const cls = {
    green:  "bg-green-100 text-green-700 hover:bg-green-200",
    red:    "bg-red-100 text-red-600 hover:bg-red-200",
    yellow: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
    blue:   "bg-blue-100 text-primary-blue hover:bg-blue-200",
    gray:   "bg-gray-100 text-gray-600 hover:bg-gray-200",
  };
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${cls[color]}`}
      aria-label={label}
    >
      {Icon && <Icon size={12} />}
      {label}
    </button>
  );
}

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    getAllWorkers().then(data => { setWorkers(data); setLoading(false); });
  }, []);

  async function handleAction(action, id) {
    const fns = { approve: approveWorker, reject: rejectWorker, activate: activateWorker, deactivate: deactivateWorker };
    if (fns[action]) await fns[action](id);
    // TODO: Refresh worker list from API after action
  }

  async function handleBlock(id) {
    await blockUser(id, "worker");
    // TODO: Refresh worker list from API after block
  }

  const filtered = workers.filter(w => {
    const matchSearch = !search || w.name?.toLowerCase().includes(search.toLowerCase()) || w.mobile?.includes(search);
    const matchStatus = statusFilter === "all" || w.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1
          className="text-2xl font-black text-text-primary"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          Workers प्रबंधन / Manage Workers
        </h1>
        <p className="text-text-secondary text-sm mt-0.5">Approve, activate, block, and manage all workers</p>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white border-2 border-border-light rounded-xl px-4 py-2.5 flex-1 min-w-48">
          <Search size={16} className="text-text-secondary flex-shrink-0" />
          <input
            type="text"
            placeholder="नाम या मोबाइल खोजें / Search name or mobile"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-secondary"
          />
        </div>
        <div className="flex items-center gap-2 bg-white border-2 border-border-light rounded-xl px-4 py-2.5">
          <Filter size={16} className="text-text-secondary" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-transparent outline-none text-sm text-text-primary"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border-2 border-border-light overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b-2 border-border-light bg-neutral-bg">
                {["नाम / Name", "Mobile", "Category", "Gender", "Service", "Status", "Work", "Rating", "Expires", "Actions"].map(h => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-text-secondary font-semibold text-xs whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={10} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12">
                    <EmptyState
                      icon="workers"
                      titleHi="कोई Worker नहीं मिला"
                      titleEn="No workers found"
                      descHi="फ़िल्टर बदलें या बाद में चेक करें।"
                      descEn="Try adjusting your filters or check back later."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map(w => (
                  <tr key={w.id} className="border-b border-border-light hover:bg-neutral-bg transition-colors last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-text-primary">{w.name ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{w.mobile ?? "—"}</td>
                    <td className="px-4 py-3 text-text-secondary">{w.category ?? "—"}</td>
                    <td className="px-4 py-3 text-text-secondary capitalize">{w.gender ?? "—"}</td>
                    <td className="px-4 py-3 text-text-secondary">{w.serviceType ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${STATUS_BADGE[w.status] ?? STATUS_BADGE.pending}`}>
                        {w.status ?? "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${WORK_BADGE[w.workStatus] ?? WORK_BADGE.free}`}>
                        {w.workStatus === "working" ? "व्यस्त" : "खाली"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-text-primary">{w.rating ?? "—"}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{w.subscriptionExpiry ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {w.status === "pending" && (
                          <>
                            <ActionBtn label="Approve" icon={CheckCircle} color="green" onClick={() => handleAction("approve", w.id)} />
                            <ActionBtn label="Reject"  icon={XCircle}     color="red"   onClick={() => handleAction("reject",  w.id)} />
                          </>
                        )}
                        {w.status === "approved" && (
                          <ActionBtn label="Deactivate" icon={ShieldOff}   color="yellow" onClick={() => handleAction("deactivate", w.id)} />
                        )}
                        {(w.status === "rejected" || w.status === "deactivated") && (
                          <ActionBtn label="Activate" icon={ShieldCheck} color="green" onClick={() => handleAction("activate", w.id)} />
                        )}
                        <ActionBtn label="Block" icon={Ban} color="gray" onClick={() => handleBlock(w.id)} />
                        <ActionBtn label="Boost ⭐" icon={Star} color="blue" onClick={() => {}} />
                        <ActionBtn label="Extend" icon={CalendarCheck} color="blue" onClick={() => {}} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-border-light bg-neutral-bg text-xs text-text-secondary">
            {filtered.length} worker{filtered.length !== 1 ? "s" : ""} shown
          </div>
        )}
      </div>
    </div>
  );
}
