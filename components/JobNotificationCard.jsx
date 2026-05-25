"use client";

import { useState } from "react";
import { MapPin, Clock, Briefcase, CheckCircle, XCircle, Play, Trophy } from "lucide-react";
import { acceptJob, rejectJob } from "@/lib/api/jobs";

async function startJob(jobId) {
  const token = typeof window !== "undefined" ? localStorage.getItem("kaamsetu_token") : null;
  const res = await fetch(`/api/jobs/${jobId}/start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function completeJob(jobId) {
  const token = typeof window !== "undefined" ? localStorage.getItem("kaamsetu_token") : null;
  const res = await fetch(`/api/jobs/${jobId}/complete`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export default function JobNotificationCard({ job, onAccepted, onRejected }) {
  const [loading, setLoading] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [workStage, setWorkStage] = useState("accepted");

  async function handleAccept() {
    setLoading("accept");
    const res = await acceptJob(job.id);
    setLoading(null);
    if (res.success) {
      setAccepted(true);
      setShowPopup(true);
      onAccepted?.(job.id);
    }
  }

  async function handleReject() {
    setLoading("reject");
    await rejectJob(job.id);
    setLoading(null);
    setRejected(true);
    onRejected?.(job.id);
  }

  async function handleStart() {
    setLoading("start");
    await startJob(job.id);
    setLoading(null);
    setWorkStage("started");
  }

  async function handleComplete() {
    setLoading("complete");
    await completeJob(job.id);
    setLoading(null);
    setWorkStage("completed");
  }

  if (rejected) {
    return (
      <div className="bg-gray-50 rounded-2xl border-2 border-gray-200 p-4 opacity-60">
        <p className="text-center text-gray-500 text-sm font-hindi">
          यह जॉब reject कर दी गई / Job rejected
        </p>
      </div>
    );
  }

  if (accepted) {
    if (workStage === "completed") {
      return (
        <div className="bg-blue-50 rounded-2xl border-2 border-blue-500 p-4 text-center">
          <Trophy size={28} className="text-blue-600 mx-auto mb-2" />
          <p className="font-black text-blue-700 font-hindi">काम पूरा! / Job Completed!</p>
          <p className="text-blue-600 text-sm mt-1 font-hindi">बहुत अच्छा! Rating आने पर यहाँ दिखेगी।</p>
        </div>
      );
    }

    return (
      <>
        {/* Popup shown once on accept */}
        {showPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-xl">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="font-black text-brand-navy text-xl mb-2 font-hindi">Job Accept हो गई!</h3>
              <p className="text-gray-600 font-hindi mb-1">Client थोड़ी देर में आपको call करेगा।</p>
              <p className="text-gray-400 text-sm mb-5">The client will call you shortly. Keep your phone nearby.</p>
              <button onClick={() => setShowPopup(false)}
                className="w-full bg-brand-navy text-white font-bold py-3 rounded-2xl font-hindi">
                ठीक है / OK
              </button>
            </div>
          </div>
        )}

        <div className="bg-green-50 rounded-2xl border-2 border-green-500 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-green-600" />
            <span className="font-bold text-green-700 font-hindi">जॉब Accept हो गई! / Job Accepted!</span>
          </div>

          <div className="bg-green-100 rounded-xl px-3 py-2 text-center">
            <p className="text-green-700 text-sm font-hindi">📞 Client जल्द ही call करेगा — फ़ोन पास रखें</p>
            <p className="text-green-600 text-xs mt-0.5">Client will call you soon. Keep your phone nearby.</p>
          </div>

          {workStage === "accepted" && (
            <button onClick={handleStart} disabled={!!loading}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white font-bold py-2.5 rounded-xl hover:bg-orange-600 transition-colors text-sm disabled:opacity-50">
              <Play size={16} />
              <span className="font-hindi">काम शुरू हुआ / Work Started</span>
            </button>
          )}

          {workStage === "started" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-orange-100 rounded-xl px-3 py-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-orange-700 font-bold text-sm font-hindi">काम चल रहा है / Work in Progress</span>
              </div>
              <button onClick={handleComplete} disabled={!!loading}
                className="w-full flex items-center justify-center gap-1.5 bg-blue-600 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">
                <Trophy size={14} />
                <span className="font-hindi">काम पूरा / Complete</span>
              </button>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-brand-yellow p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-brand-yellow/20 rounded-xl flex items-center justify-center">
            <Briefcase size={20} className="text-brand-navy" />
          </div>
          <div>
            <p className="font-bold text-brand-navy">{job.category}</p>
            <p className="text-sm text-gray-500">{job.subcategory}</p>
          </div>
        </div>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Clock size={12} /> {job.postedAgo || "अभी"}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
        <span className="flex items-center gap-1">
          <MapPin size={14} /> {job.location || "—"}
        </span>
        {job.distanceKm && (
          <span className="text-brand-navy font-semibold">{job.distanceKm} km दूर</span>
        )}
      </div>

      {job.description && (
        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3">{job.description}</p>
      )}

      <div className="flex gap-3">
        <button onClick={handleReject} disabled={!!loading}
          className="flex-1 flex items-center justify-center gap-2 border-2 border-red-300 text-red-600 font-bold py-3 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50">
          <XCircle size={18} />
          <span className="font-hindi">रद्द करें / Reject</span>
        </button>
        <button onClick={handleAccept} disabled={!!loading}
          className="flex-1 flex items-center justify-center gap-2 bg-brand-navy text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
          <CheckCircle size={18} />
          <span className="font-hindi">Accept करें / Accept</span>
        </button>
      </div>
    </div>
  );
}
