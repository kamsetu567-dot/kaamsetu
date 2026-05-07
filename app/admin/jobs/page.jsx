"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { TableRowSkeleton } from "@/components/LoadingSkeleton";
import { getAllJobs } from "@/lib/api/admin";

const STATUS_BADGE = {
  open:       "bg-blue-100 text-primary-blue border-blue-200",
  accepted:   "bg-green-100 text-green-700 border-green-200",
  completed:  "bg-gray-100 text-gray-600 border-gray-200",
  cancelled:  "bg-red-100 text-red-600 border-red-200",
};

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getAllJobs({ search: search || undefined }).then(data => {
      setJobs(data);
      setLoading(false);
    });
  }, []);

  function refresh() {
    setLoading(true);
    getAllJobs({ search: search || undefined }).then(data => {
      setJobs(data);
      setLoading(false);
    });
  }

  const q = search.toLowerCase();
  const filtered = jobs.filter(j =>
    !search ||
    j.clientName?.toLowerCase().includes(q) ||
    j.clientMobile?.includes(q) ||
    j.category?.toLowerCase().includes(q) ||
    j.location?.toLowerCase().includes(q)
  );

  return (
    <div className="space-y-5">
      <div>
        <h1
          className="text-2xl font-black text-text-primary"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          Jobs / सभी जॉब्स
        </h1>
        <p className="text-text-secondary text-sm mt-0.5">All job requests across the platform</p>
      </div>

      <div className="flex items-center gap-2 bg-white border-2 border-border-light rounded-xl px-4 py-2.5 max-w-sm">
        <Search size={16} className="text-text-secondary flex-shrink-0" />
        <input
          type="text"
          placeholder="Job ID, Category, या Location"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-text-secondary"
        />
      </div>

      <div className="bg-white rounded-3xl border-2 border-border-light overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b-2 border-border-light bg-neutral-bg">
                {["Job ID", "Client", "Category", "Location", "Source", "Status", "Worker"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-text-secondary font-semibold text-xs whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12">
                    <EmptyState
                      icon="default"
                      titleHi="कोई Job नहीं"
                      titleEn="No jobs found"
                      descHi="अभी कोई job request नहीं आई है।"
                      descEn="No job requests have been made yet."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map(j => (
                  <tr key={j.id} className="border-b border-border-light hover:bg-neutral-bg last:border-0 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary truncate max-w-[100px]">{String(j.id).slice(-8)}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      <p className="font-semibold">{j.clientName ?? "—"}</p>
                      <p className="text-xs">{j.clientMobile ?? ""}</p>
                    </td>
                    <td className="px-4 py-3 text-text-primary">{j.category ?? "—"}</td>
                    <td className="px-4 py-3 text-text-secondary">{j.location ?? "—"}</td>
                    <td className="px-4 py-3 text-text-secondary capitalize">{j.source ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${STATUS_BADGE[j.status] ?? STATUS_BADGE.open}`}>
                        {j.status ?? "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{j.worker ? String(j.worker).slice(-8) : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
