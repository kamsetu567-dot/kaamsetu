"use client";

import { useState } from "react";
import { MapPin, Clock, Briefcase, Phone, CheckCircle, XCircle } from "lucide-react";
import { acceptJob, rejectJob } from "@/lib/api/jobs";

export default function JobNotificationCard({ job, onAccepted, onRejected }) {
  const [loading, setLoading] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [clientMobile, setClientMobile] = useState(null);

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
        <p className="text-center text-text-secondary text-sm">
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>यह जॉब reject कर दी गई</span>
          <span> / Job rejected</span>
        </p>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="bg-green-50 rounded-2xl border-2 border-primary-green p-4">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle size={20} className="text-primary-green" />
          <span className="font-bold text-primary-green" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            जॉब Accept हो गई! / Job Accepted!
          </span>
        </div>
        {clientMobile && (
          <a href={`tel:+91${clientMobile}`} className="flex items-center gap-2 bg-primary-green text-white font-bold px-4 py-3 rounded-xl mt-2 hover:bg-green-700 transition-colors">
            <Phone size={18} />
            <span>Client को Call करें: +91 {clientMobile}</span>
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-primary-orange p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <Briefcase size={20} className="text-primary-orange" />
          </div>
          <div>
            <p className="font-bold text-text-primary">{job.category}</p>
            <p className="text-sm text-text-secondary">{job.subcategory}</p>
          </div>
        </div>
        <span className="text-xs text-text-secondary flex items-center gap-1">
          <Clock size={12} /> {job.postedAgo || "अभी"}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm text-text-secondary mb-4">
        <span className="flex items-center gap-1">
          <MapPin size={14} /> {job.location || "—"}
        </span>
        {job.distance && (
          <span className="text-primary-blue font-semibold">{job.distance} km दूर</span>
        )}
      </div>

      {job.notes && (
        <p className="text-sm text-text-secondary bg-gray-50 rounded-lg px-3 py-2 mb-3">
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
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>रद्द करें</span>
          <span className="text-sm font-normal">/ Reject</span>
        </button>
        <button
          onClick={handleAccept}
          disabled={!!loading}
          className="flex-2 flex-1 flex items-center justify-center gap-2 bg-primary-green text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
          aria-label="Accept job"
        >
          <CheckCircle size={18} />
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>Accept करें</span>
          <span className="text-sm font-normal">/ Accept</span>
        </button>
      </div>
    </div>
  );
}
