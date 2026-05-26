"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle, Clock } from "lucide-react";
import JobNotificationCard from "@/components/JobNotificationCard";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { getIncomingJobs, getJobHistory } from "@/lib/api/jobs";
import { useRoleGuard } from "@/lib/auth/useRoleGuard";

const HISTORY_STATUS = {
  completed:   { label: "✅ Completed",   cls: "bg-blue-100 text-blue-700" },
  accepted:    { label: "⏳ Accepted",     cls: "bg-green-100 text-green-700" },
  in_progress: { label: "🔧 In Progress", cls: "bg-orange-100 text-orange-700" },
  rejected:    { label: "✗ Rejected",     cls: "bg-red-100 text-red-600" },
};

export default function WorkerJobsPage() {
  useRoleGuard("worker");
  const [jobs, setJobs] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const pollRef = useRef(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("kaamsetu_token") : null;
    let workerId = null;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        workerId = payload.id || null;
      } catch {}
    }

    function fetchJobs() {
      getIncomingJobs(workerId)
        .then(setJobs)
        .finally(() => setLoading(false));
    }

    getJobHistory(workerId)
      .then(setHistory)
      .finally(() => setHistoryLoading(false));

    fetchJobs();
    pollRef.current = setInterval(fetchJobs, 10_000);
    return () => clearInterval(pollRef.current);
  }, []);

  function handleAccepted() {}
  function handleRejected() {}

  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-xl font-black text-brand-navy"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            Incoming Jobs / आने वाली जॉब्स
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Accept करने पर client call करेगा / Client will call you after accept
          </p>
        </div>
        <div className="relative">
          <Bell size={24} className="text-blue-600" />
          {jobs.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {jobs.length}
            </span>
          )}
        </div>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 bg-green-50 border-2 border-green-200 rounded-2xl px-4 py-3">
        <span className="w-2.5 h-2.5 bg-green-600 rounded-full animate-pulse flex-shrink-0" />
        <p
          className="text-green-600 font-semibold text-sm"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          Live — नए jobs यहाँ आएंगे / New jobs will appear here
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton type="card" count={3} />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon="jobs"
          titleHi="अभी कोई जॉब नहीं"
          titleEn="No incoming jobs right now"
          descHi="जब कोई client request करेगा, job यहाँ दिखेगी।"
          descEn="When a client sends a request near you, it will appear here."
        />
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <JobNotificationCard
              key={job.id}
              job={job}
              onAccepted={handleAccepted}
              onRejected={handleRejected}
            />
          ))}
        </div>
      )}

      {/* Job history */}
      <div className="bg-white rounded-3xl border-2 border-gray-200 p-5">
        <h3 className="font-bold text-brand-navy mb-3" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
          जॉब इतिहास / Job History
        </h3>
        {historyLoading ? (
          <LoadingSkeleton type="card" count={2} />
        ) : history.length === 0 ? (
          <EmptyState icon="jobs" titleHi="कोई पुरानी जॉब नहीं" titleEn="No past jobs yet"
            descHi="आपकी completed जॉब्स यहाँ दिखेंगी।" descEn="Your completed jobs will appear here." />
        ) : (
          <div className="space-y-3">
            {history.map(job => {
              const cfg = HISTORY_STATUS[job.status] || HISTORY_STATUS.accepted;
              return (
                <div key={job.id} className="flex items-start justify-between gap-3 border border-gray-100 rounded-xl p-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-brand-navy text-sm">{job.subcategory || job.category}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock size={11} /> {new Date(job.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${cfg.cls}`}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
