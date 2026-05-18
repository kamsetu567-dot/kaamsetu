"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import JobNotificationCard from "@/components/JobNotificationCard";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { getIncomingJobs } from "@/lib/api/jobs";
import { useRoleGuard } from "@/lib/auth/useRoleGuard";

export default function WorkerJobsPage() {
  useRoleGuard("worker");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
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

    fetchJobs();
    pollRef.current = setInterval(fetchJobs, 10_000);
    return () => clearInterval(pollRef.current);
  }, []);

  function handleAccepted(jobId) {
    // Keep card in view (it shows accepted state), don't remove from list
  }

  function handleRejected(jobId) {
    // Card shows rejected state inline — no list change needed
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
            Accept करने पर client का नंबर मिलेगा / Accept to reveal client's number
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

      {/* Job history link */}
      <div className="bg-white rounded-3xl border-2 border-gray-200 p-5">
        <h3
          className="font-bold text-brand-navy mb-3"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          जॉब इतिहास / Job History
        </h3>
        <EmptyState
          icon="jobs"
          titleHi="कोई पुरानी जॉब नहीं"
          titleEn="No past jobs yet"
          descHi="आपकी completed जॉब्स यहाँ दिखेंगी।"
          descEn="Your completed jobs will appear here."
        />
      </div>
    </div>
  );
}
