"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, CheckCircle, Clock, AlertCircle, RefreshCw, MapPin } from "lucide-react";
import JobNotificationCard from "@/components/JobNotificationCard";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { getJobHistory } from "@/lib/api/jobs";
import { apiGet } from "@/lib/api/client";
import { useRoleGuard } from "@/lib/auth/useRoleGuard";

const HISTORY_STATUS = {
  completed:   { label: "✅ Completed",   cls: "bg-blue-100 text-blue-700" },
  accepted:    { label: "⏳ Accepted",     cls: "bg-green-100 text-green-700" },
  in_progress: { label: "🔧 In Progress", cls: "bg-orange-100 text-orange-700" },
  rejected:    { label: "✗ Rejected",     cls: "bg-red-100 text-red-600" },
  cancelled:   { label: "✗ Cancelled",    cls: "bg-gray-100 text-gray-600" },
};

export default function WorkerJobsPage() {
  useRoleGuard("worker");
  const [jobs, setJobs] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  // Set by the API when the worker has no city saved. Jobs are matched by city,
  // so without one the feed is empty by design — say so instead of leaving them
  // staring at "no jobs" forever.
  const [cityMissing, setCityMissing] = useState(false);
  const pollRef = useRef(null);
  const workerIdRef = useRef(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("kaamsetu_token") : null;
    let workerId = null;
    if (token) {
      try {
        const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(b64 + "=".repeat((4 - b64.length % 4) % 4)));
        workerId = payload.id || null;
      } catch {}
    }
    workerIdRef.current = workerId;

    async function fetchJobs() {
      try {
        const data = await apiGet("/api/jobs", { workerId, status: "pending" });
        setJobs(data.jobs || []);
        setCityMissing(!!data.cityMissing);
        setFetchError(null);
      } catch (err) {
        setFetchError(err.message || "Connection error");
        setJobs([]);
      } finally {
        setLoading(false);
      }
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

  function manualRefresh() {
    setLoading(true);
    apiGet("/api/jobs", { workerId: workerIdRef.current, status: "pending" })
      .then(data => { setJobs(data.jobs || []); setCityMissing(!!data.cityMissing); setFetchError(null); })
      .catch(err => { setFetchError(err.message || "Connection error"); setJobs([]); })
      .finally(() => setLoading(false));
  }

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
      ) : fetchError ? (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700 text-sm">Connection Error / कनेक्शन समस्या</p>
              <p className="text-red-600 text-xs mt-1">{fetchError}</p>
            </div>
          </div>
          <button
            onClick={manualRefresh}
            className="flex items-center justify-center gap-2 bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold"
          >
            <RefreshCw size={16} /> Retry / दोबारा कोशिश करें
          </button>
        </div>
      ) : cityMissing ? (
        // Jobs are matched by city. With no city saved this worker can never be
        // shown one, so an "add your city" prompt is the only useful thing here.
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle size={22} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-red-700 font-hindi">आपका शहर सेट नहीं है</p>
              <p className="text-red-600 text-sm mt-1 font-hindi">
                जब तक आप अपना शहर नहीं जोड़ते, आपको कोई नई job नहीं दिखेगी — jobs शहर के हिसाब से भेजी जाती हैं।
              </p>
              <p className="text-red-500 text-xs mt-1">
                Your city isn&apos;t set. Jobs are matched by city, so you will not receive any until you add it.
              </p>
            </div>
          </div>
          <Link href="/worker/dashboard/profile"
            className="flex items-center justify-center gap-2 bg-red-600 text-white font-bold rounded-xl py-3 text-sm hover:bg-red-700 transition-colors">
            <MapPin size={16} /> <span className="font-hindi">शहर जोड़ें / Add my city</span>
          </Link>
        </div>
      ) : jobs.length === 0 ? (
        <div className="space-y-3">
          <EmptyState
            icon="jobs"
            titleHi="अभी कोई जॉब नहीं"
            titleEn="No incoming jobs right now"
            descHi="जब कोई client request करेगा, job यहाँ दिखेगी।"
            descEn="When a client sends a request in your city, it will appear here."
          />
          <button
            onClick={manualRefresh}
            className="w-full flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm"
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
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
