"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, ShieldOff, Trash2, Eye } from "lucide-react";
import { apiGet, apiPatch } from "@/lib/api/client";
import EmptyState from "@/components/EmptyState";

const REASON_LABELS = {
  fake_profile:  "Fake Profile",
  fraud:         "Fraud",
  bad_behaviour: "Bad Behaviour",
  spam:          "Spam",
  wrong_work:    "Wrong Work",
};

const STATUS_FILTER = ["all", "pending", "reviewed", "action_taken"];

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [acting, setActing] = useState(null);

  useEffect(() => { loadReports(); }, [statusFilter]);

  async function loadReports() {
    setLoading(true);
    try {
      const data = await apiGet("/api/admin/reports", { status: statusFilter });
      setReports(data.reports || []);
    } catch {}
    setLoading(false);
  }

  async function handleAction(reportId, action) {
    if (!confirm(`Confirm: ${action}?`)) return;
    setActing(reportId);
    try {
      await apiPatch(`/api/admin/reports/${reportId}`, { action });
      await loadReports();
    } catch {}
    setActing(null);
  }

  const pendingCount = reports.filter(r => r.status === "pending").length;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-brand-navy font-hindi">
            रिपोर्ट्स / Reports
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            User-submitted reports — {pendingCount} pending review
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTER.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                statusFilter === s ? "bg-brand-navy text-white" : "bg-white border-2 border-gray-200 text-gray-500"
              }`}>
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-28" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-gray-100 p-8">
          <EmptyState icon="default" titleHi="कोई रिपोर्ट नहीं" titleEn="No reports found" descHi="" descEn="" />
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <div key={r.id} className={`bg-white rounded-2xl border-2 p-5 ${
              r.status === "pending" ? "border-red-200" : r.status === "action_taken" ? "border-green-200" : "border-gray-200"
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-black text-brand-navy">{r.reportedWorkerName || "Unknown Worker"}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      r.status === "pending" ? "bg-red-100 text-red-600" :
                      r.status === "action_taken" ? "bg-green-100 text-green-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {r.status.replace("_", " ")}
                    </span>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">
                      {REASON_LABELS[r.reason] || r.reason}
                    </span>
                  </div>
                  {r.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{r.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Reported by: {r.reportedByRole} · {new Date(r.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>

                {r.status === "pending" && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => handleAction(r.id, "mark_reviewed")}
                      disabled={acting === r.id}
                      className="flex items-center gap-1.5 text-xs font-bold bg-blue-50 text-blue-700 px-3 py-2 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50">
                      <Eye size={13} /> Review
                    </button>
                    <button onClick={() => handleAction(r.id, "block_worker")}
                      disabled={acting === r.id}
                      className="flex items-center gap-1.5 text-xs font-bold bg-orange-50 text-orange-700 px-3 py-2 rounded-xl hover:bg-orange-100 transition-colors disabled:opacity-50">
                      <ShieldOff size={13} /> Block Worker
                    </button>
                    <button onClick={() => handleAction(r.id, "delete_worker")}
                      disabled={acting === r.id}
                      className="flex items-center gap-1.5 text-xs font-bold bg-red-50 text-red-700 px-3 py-2 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50">
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                )}
                {r.status === "reviewed" && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => handleAction(r.id, "block_worker")}
                      disabled={acting === r.id}
                      className="flex items-center gap-1.5 text-xs font-bold bg-orange-50 text-orange-700 px-3 py-2 rounded-xl hover:bg-orange-100 disabled:opacity-50">
                      <ShieldOff size={13} /> Block
                    </button>
                    <button onClick={() => handleAction(r.id, "delete_worker")}
                      disabled={acting === r.id}
                      className="flex items-center gap-1.5 text-xs font-bold bg-red-50 text-red-700 px-3 py-2 rounded-xl hover:bg-red-100 disabled:opacity-50">
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
