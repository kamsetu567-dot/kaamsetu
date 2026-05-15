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
        <p className="text-center text-gray-500 text-sm font-hindi">
          यह जॉब reject कर दी गई / Job rejected
        </p>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="bg-green-50 rounded-2xl border-2 border-green-500 p-4">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle size={20} className="text-green-600" />
          <span className="font-bold text-green-700 font-hindi">जॉब Accept हो गई! / Job Accepted!</span>
        </div>
        {clientMobile && (
          <a href={`tel:+91${clientMobile}`} className="flex items-center gap-2 bg-green-600 text-white font-bold px-4 py-3 rounded-xl mt-2 hover:bg-green-700 transition-colors">
            <Phone size={18} />
            <span>Client को Call करें: +91 {clientMobile}</span>
          </a>
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
