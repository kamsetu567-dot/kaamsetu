"use client";

import { useState } from "react";
import { MapPin, Clock, Briefcase, Phone, CheckCircle, XCircle, Play, Trophy, X } from "lucide-react";
import { acceptJob, rejectJob } from "@/lib/api/jobs";

export default function JobNotificationCard({ job, onAccepted, onRejected }) {
  const [loading, setLoading] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [clientMobile, setClientMobile] = useState(null);
  const [workStage, setWorkStage] = useState("accepted"); // accepted → started → completed

  async function handleAccept() {
    setLoading("accept");
    const res = await acceptJob(job.id);
    setLoading(null);
    if (res.success) {
      setAccepted(true);
      setClientMobile(res.clientMobile);
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
          <p className="text-blue-600 text-sm mt-1">Great work! Rating आने पर यहाँ दिखेगी।</p>
        </div>
      );
    }
    return (
      <div className="bg-green-50 rounded-2xl border-2 border-green-500 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle size={20} className="text-green-600" />
          <span className="font-bold text-green-700 font-hindi">जॉब Accept हो गई! / Job Accepted!</span>
        </div>
        {clientMobile && (
          <div className="flex gap-2">
            <a href={`tel:+91${clientMobile}`}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white font-bold px-3 py-2.5 rounded-xl hover:bg-green-700 transition-colors text-sm">
              <Phone size={16} /> Call Client
            </a>
            <a href={`https://wa.me/91${clientMobile}`} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold px-3 py-2.5 rounded-xl text-sm">
              WhatsApp
            </a>
          </div>
        )}
        {workStage === "accepted" && (
          <button onClick={() => setWorkStage("started")}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white font-bold py-2.5 rounded-xl hover:bg-orange-600 transition-colors text-sm">
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
            <div className="flex gap-2">
              <button onClick={() => { setWorkStage("accepted"); setRejected(true); }}
                className="flex-1 flex items-center justify-center gap-1.5 border-2 border-red-300 text-red-600 font-bold py-2.5 rounded-xl text-sm">
                <X size={14} /> Cancel
              </button>
              <button onClick={() => setWorkStage("completed")}
                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white font-bold py-2.5 rounded-xl text-sm">
                <Trophy size={14} /> Complete
              </button>
            </div>
          </div>
        )}
      </div>
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
        {job.distance && (
          <span className="text-brand-navy font-semibold">{job.distance} km दूर</span>
        )}
      </div>

      {job.notes && (
        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3">
          {job.notes}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleReject}
          disabled={!!loading}
          className="flex-1 flex items-center justify-center gap-2 border-2 border-red-300 text-red-600 font-bold py-3 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
          aria-label="Reject job"
        >
          <XCircle size={18} />
          <span className="font-hindi">रद्द करें</span>
          <span className="text-sm font-normal">/ Reject</span>
        </button>
        <button
          onClick={handleAccept}
          disabled={!!loading}
          className="flex-1 flex items-center justify-center gap-2 bg-brand-navy text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          aria-label="Accept job"
        >
          <CheckCircle size={18} />
          <span className="font-hindi">Accept करें</span>
          <span className="text-sm font-normal">/ Accept</span>
        </button>
      </div>
    </div>
  );
}
