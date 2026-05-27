"use client";

import { useState, useEffect } from "react";
import { CreditCard, CheckCircle, Clock, AlertCircle, Copy } from "lucide-react";
import { useRoleGuard } from "@/lib/auth/useRoleGuard";
import EmptyState from "@/components/EmptyState";
import SubscriptionCountdown from "@/components/SubscriptionCountdown";

// UPI details shown to worker for manual payment (backend will verify later)
const UPI_ID = "kaamsetu@upi";
const QR_PLACEHOLDER = "https://picsum.photos/seed/qr/200/200";

export default function WorkerSubscriptionPage() {
  useRoleGuard("worker");
  const [copied, setCopied] = useState(false);
  const [worker, setWorker] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("kaamsetu_token") : null;
    if (!token) { setLoaded(true); return; }
    fetch("/api/workers/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.success && data.worker) setWorker(data.worker); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  function copyUPI() {
    navigator.clipboard?.writeText(UPI_ID).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const expiresAt = worker?.subscriptionExpiry;
  const isActive = expiresAt && new Date(expiresAt) > new Date();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2
          className="text-xl font-black text-brand-navy"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          सब्सक्रिप्शन
        </h2>
        <p className="text-gray-500 text-sm mt-0.5">Subscription Plan — ₹199/month</p>
      </div>

      {/* Current status card */}
      {!loaded ? (
        <div className="bg-gray-50 border-2 border-gray-200 rounded-3xl p-6 h-32 animate-pulse" />
      ) : isActive ? (
        <div className="bg-green-50 border-2 border-green-600 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle size={28} className="text-green-600" />
            <div>
              <p
                className="font-black text-green-600 text-lg"
                style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
              >
                Subscription Active है!
              </p>
              <p className="text-green-700 text-sm">Subscription is active</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 mb-3 text-center">
            <p className="text-xs text-gray-500 mb-1.5">Time remaining / बचा हुआ समय</p>
            <SubscriptionCountdown expiresAt={expiresAt} size="lg" />
          </div>
          <p className="text-xs text-gray-500 text-center">
            Expires on {new Date(expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      ) : (
        <div className="bg-yellow-50 border-2 border-accent-yellow rounded-3xl p-5 flex items-start gap-3">
          <AlertCircle size={24} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p
              className="font-black text-yellow-800"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              {expiresAt ? "Subscription Expired" : "Subscription Pending है"}
            </p>
            <p className="text-yellow-700 text-sm">
              {expiresAt
                ? "Renew now to keep receiving jobs. / Jobs आना बंद हो गई हैं, abhi renew करें."
                : "Admin approval के बाद subscription start होगी। / Subscription starts after admin approval."}
            </p>
          </div>
        </div>
      )}

      {/* Plan details */}
      <div className="bg-white rounded-3xl border-2 border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3
              className="font-black text-brand-navy text-lg"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              Monthly Plan
            </h3>
            <p className="text-gray-500 text-sm">मासिक प्लान</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-green-600">₹199</p>
            <p className="text-gray-500 text-xs">/month · प्रति माह</p>
          </div>
        </div>

        <ul className="space-y-2 mb-5">
          {[
            { hi: "Unlimited Job Notifications", en: "असीमित job notifications" },
            { hi: "Direct Client Contact", en: "Client का नंबर मिलेगा" },
            { hi: "Profile Listed in Search", en: "Search में profile दिखेगी" },
            { hi: "Priority in Results", en: "पहले दिखने का मौका" },
            { hi: "30-Day Validity", en: "30 दिन की validity" },
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
              <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{item.en}</span>
              <span className="text-gray-500">/ {item.hi}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Payment section */}
      <div className="bg-white rounded-3xl border-2 border-gray-200 p-6">
        <h3
          className="font-black text-brand-navy mb-4"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          भुगतान करें / Make Payment
        </h3>

        {/* QR code */}
        <div className="flex flex-col items-center mb-5">
          <div className="w-40 h-40 bg-gray-100 rounded-2xl overflow-hidden border-2 border-gray-200 mb-3">
            <img
              src={QR_PLACEHOLDER}
              alt="UPI QR Code for payment"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-gray-500 text-sm text-center">
            <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>QR Code scan करें</span>
            {" / Scan to pay"}
          </p>
        </div>

        {/* UPI ID */}
        <div className="flex items-center justify-between bg-brand-bg border-2 border-gray-200 rounded-xl px-4 py-3 mb-5">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">UPI ID</p>
            <p className="font-bold text-brand-navy text-base">{UPI_ID}</p>
          </div>
          <button
            onClick={copyUPI}
            className="flex items-center gap-1.5 bg-blue-600 text-white font-semibold text-sm px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            aria-label="Copy UPI ID"
          >
            <Copy size={14} />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Instructions */}
        <ol className="space-y-2 text-sm text-gray-500 list-decimal list-inside">
          <li>UPI ID copy करें या QR scan करें</li>
          <li>₹199 pay करें</li>
          <li>
            <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
              Payment screenshot Admin को WhatsApp करें
            </span>
          </li>
          <li>Admin approval के बाद subscription activate होगी</li>
        </ol>

        {/* Renew button */}
        <button
          className="mt-5 w-full bg-green-600 text-white font-black text-lg py-4 rounded-2xl hover:bg-green-700 transition-colors min-h-14"
          aria-label="Renew subscription"
          onClick={() => alert("Payment details ऊपर दिए गए हैं। UPI से pay करें। / Pay via UPI details shown above.")}
        >
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            {isActive ? "नवीनीकरण करें / Renew" : "₹199 Pay करें / Pay Now"}
          </span>
        </button>
      </div>

      {/* Payment history */}
      <div className="bg-white rounded-3xl border-2 border-gray-200 p-5">
        <h3
          className="font-bold text-brand-navy mb-3"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          भुगतान इतिहास / Payment History
        </h3>
        <EmptyState
          icon="default"
          titleHi="कोई भुगतान नहीं"
          titleEn="No payment history"
          descHi="पहले payment के बाद यहाँ record आएगा।"
          descEn="Records will appear after first payment."
        />
      </div>
    </div>
  );
}
