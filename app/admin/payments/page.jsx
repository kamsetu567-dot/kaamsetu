"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, IndianRupee, X, UserCheck, Store } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { getPendingPayments, reviewPayment } from "@/lib/api/admin";
import { useT } from "@/lib/i18n/useT";

const STATUS_FILTERS = ["pending_review", "paid", "rejected", "all"];

export default function AdminPaymentsPage() {
  const t = useT();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending_review");
  const [actionMap, setActionMap] = useState({});   // id → "approving" | "rejecting"
  const [rejectNote, setRejectNote] = useState({});  // id → string
  const [zoomSrc, setZoomSrc] = useState(null);

  async function load(status) {
    setLoading(true);
    const list = await getPendingPayments(status);
    setPayments(list);
    setLoading(false);
  }

  useEffect(() => { load(filter); }, [filter]);

  async function handleAction(id, action) {
    setActionMap(m => ({ ...m, [id]: action === "approve" ? "approving" : "rejecting" }));
    try {
      const res = await reviewPayment(id, action, rejectNote[id] || "");
      if (res && res.success !== false) {
        // Drop it from the current (pending) view; other filters just refetch.
        if (filter === "pending_review") {
          setPayments(prev => prev.filter(p => p.id !== id));
        } else {
          await load(filter);
        }
      }
    } catch {
      // leave the row; the admin can retry
    }
    setActionMap(m => { const n = { ...m }; delete n[id]; return n; });
  }

  const filterLabel = {
    pending_review: t({ hi: 'लंबित', en: 'Pending' }),
    paid: t({ hi: 'स्वीकृत', en: 'Approved' }),
    rejected: t({ hi: 'अस्वीकृत', en: 'Rejected' }),
    all: t({ hi: 'सभी', en: 'All' }),
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Screenshot zoom */}
      {zoomSrc && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setZoomSrc(null)}>
          <button
            type="button"
            onClick={() => setZoomSrc(null)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label={t({ hi: 'बंद करें', en: 'Close' })}
          >
            <X size={20} />
          </button>
          <img
            src={zoomSrc}
            alt={t({ hi: 'पूरा साइज़ screenshot', en: 'Payment screenshot full size' })}
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      <div>
        <h1 className="text-2xl font-black text-brand-navy flex items-center gap-2">
          <IndianRupee size={24} /> {t({ hi: 'पेमेंट अनुरोध', en: 'Payment Requests' })}
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {t({ hi: 'UPI QR भुगतान की समीक्षा करें और approve करें', en: 'Review UPI-QR payments and approve to activate' })}
        </p>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              filter === s ? "bg-brand-navy text-white" : "bg-white border-2 border-gray-200 text-gray-600 hover:border-brand-navy"
            }`}>
            {filterLabel[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton type="card" count={3} />
      ) : payments.length === 0 ? (
        <EmptyState icon="default"
          titleHi="कोई पेमेंट नहीं"
          titleEn="No payment requests"
          descHi="अभी समीक्षा के लिए कोई पेमेंट नहीं है।"
          descEn="Nothing to review for this filter." />
      ) : (
        <div className="space-y-4">
          {payments.map(p => {
            const busy = actionMap[p.id];
            const isSub = p.purpose === "subscription";
            const m = p.meta || {};
            return (
              <div key={p.id} className="bg-white rounded-2xl border-2 border-gray-200 p-4">
                <div className="flex items-start gap-4">
                  {/* Screenshot thumbnail */}
                  {p.screenshotUrl ? (
                    <button
                      type="button"
                      onClick={() => setZoomSrc(p.screenshotUrl)}
                      className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-200 hover:opacity-90 transition-opacity"
                      aria-label={t({ hi: 'screenshot देखें', en: 'View screenshot' })}
                    >
                      <img src={p.screenshotUrl} alt="Payment proof" className="w-full h-full object-cover" />
                    </button>
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-gray-50 flex-shrink-0 border border-gray-200 flex items-center justify-center text-gray-300 text-xs">
                      {t({ hi: 'कोई proof नहीं', en: 'No proof' })}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${isSub ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                        {isSub ? <UserCheck size={12} /> : <Store size={12} />}
                        {isSub ? t({ hi: 'सब्सक्रिप्शन', en: 'Subscription' }) : t({ hi: 'विज्ञापन', en: 'Ad' })}
                      </span>
                      <span className="font-black text-brand-navy text-lg">₹{p.amount}</span>
                    </div>
                    <p className="font-bold text-brand-navy">{p.payerName}</p>
                    {p.payerMobile && <p className="text-gray-500 text-sm">📱 {p.payerMobile}</p>}
                    <p className="text-gray-400 text-xs mt-0.5">
                      {isSub
                        ? `${t({ hi: 'मासिक प्लान', en: 'Monthly plan' })} · ${m.days || 30} ${t({ hi: 'दिन', en: 'days' })}`
                        : `${m.type || "ad"} · ${m.category || ""} · ${m.duration || 0} ${t({ hi: 'दिन', en: 'days' })}`}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {t({ hi: 'सबमिट:', en: 'Submitted:' })} {new Date(p.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                    </p>
                    {p.status === "rejected" && p.rejectReason && (
                      <p className="text-red-500 text-xs mt-1 bg-red-50 rounded-lg px-3 py-1.5">{t({ hi: 'कारण:', en: 'Reason:' })} {p.rejectReason}</p>
                    )}
                  </div>
                </div>

                {/* Actions — only when pending */}
                {p.status === "pending_review" && (
                  <div className="space-y-3 pt-3 mt-3 border-t border-gray-100">
                    <input
                      placeholder={t({ hi: 'अस्वीकृति का कारण (वैकल्पिक)...', en: 'Rejection reason (optional)...' })}
                      value={rejectNote[p.id] || ""}
                      onChange={e => setRejectNote(mm => ({ ...mm, [p.id]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-navy"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAction(p.id, "approve")}
                        disabled={!!busy}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-2.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 text-sm">
                        <CheckCircle size={16} />
                        {busy === "approving" ? t({ hi: 'हो रहा है...', en: 'Approving...' }) : t({ hi: 'अप्रूव करें', en: 'Approve' })}
                      </button>
                      <button
                        onClick={() => handleAction(p.id, "reject")}
                        disabled={!!busy}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white font-bold py-2.5 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 text-sm">
                        <XCircle size={16} />
                        {busy === "rejecting" ? t({ hi: 'हो रहा है...', en: 'Rejecting...' }) : t({ hi: 'अस्वीकार', en: 'Reject' })}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
