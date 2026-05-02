"use client";

import { useState } from "react";
import { CreditCard, CheckCircle, Clock, AlertCircle, Copy } from "lucide-react";
import EmptyState from "@/components/EmptyState";

// UPI details shown to worker for manual payment (backend will verify later)
const UPI_ID = "kaamsetu@upi";
const QR_PLACEHOLDER = "https://picsum.photos/seed/qr/200/200";

export default function WorkerSubscriptionPage() {
  const [copied, setCopied] = useState(false);

  function copyUPI() {
    navigator.clipboard?.writeText(UPI_ID).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // TODO: Persist via API when backend is ready — fetch real subscription from backend
  const subscription = null; // null = no active subscription

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2
          className="text-xl font-black text-text-primary"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          सब्सक्रिप्शन
        </h2>
        <p className="text-text-secondary text-sm mt-0.5">Subscription Plan — ₹199/month</p>
      </div>

      {/* Current status card */}
      {subscription ? (
        <div className="bg-green-50 border-2 border-primary-green rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle size={28} className="text-primary-green" />
            <div>
              <p
                className="font-black text-primary-green text-lg"
                style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
              >
                Subscription Active है!
              </p>
              <p className="text-green-700 text-sm">Subscription is active</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-text-secondary" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>शुरू हुई</p>
              <p className="font-bold">{subscription.startDate}</p>
            </div>
            <div>
              <p className="text-text-secondary" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>खत्म होगी</p>
              <p className="font-bold text-red-600">{subscription.endDate}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border-2 border-accent-yellow rounded-3xl p-5 flex items-start gap-3">
          <AlertCircle size={24} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p
              className="font-black text-yellow-800"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              Subscription Pending है
            </p>
            <p className="text-yellow-700 text-sm">
              Admin approval के बाद subscription start होगी। / Subscription starts after admin approval.
            </p>
          </div>
        </div>
      )}

      {/* Plan details */}
      <div className="bg-white rounded-3xl border-2 border-border-light p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3
              className="font-black text-text-primary text-lg"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              Monthly Plan
            </h3>
            <p className="text-text-secondary text-sm">मासिक प्लान</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-primary-green">₹199</p>
            <p className="text-text-secondary text-xs">/month · प्रति माह</p>
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
              <CheckCircle size={16} className="text-primary-green flex-shrink-0" />
              <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{item.en}</span>
              <span className="text-text-secondary">/ {item.hi}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Payment section */}
      <div className="bg-white rounded-3xl border-2 border-border-light p-6">
        <h3
          className="font-black text-text-primary mb-4"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          भुगतान करें / Make Payment
        </h3>

        {/* QR code */}
        <div className="flex flex-col items-center mb-5">
          <div className="w-40 h-40 bg-gray-100 rounded-2xl overflow-hidden border-2 border-border-light mb-3">
            <img
              src={QR_PLACEHOLDER}
              alt="UPI QR Code for payment"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-text-secondary text-sm text-center">
            <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>QR Code scan करें</span>
            {" / Scan to pay"}
          </p>
        </div>

        {/* UPI ID */}
        <div className="flex items-center justify-between bg-neutral-bg border-2 border-border-light rounded-xl px-4 py-3 mb-5">
          <div>
            <p className="text-xs text-text-secondary mb-0.5">UPI ID</p>
            <p className="font-bold text-text-primary text-base">{UPI_ID}</p>
          </div>
          <button
            onClick={copyUPI}
            className="flex items-center gap-1.5 bg-primary-blue text-white font-semibold text-sm px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            aria-label="Copy UPI ID"
          >
            <Copy size={14} />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Instructions */}
        <ol className="space-y-2 text-sm text-text-secondary list-decimal list-inside">
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
          className="mt-5 w-full bg-primary-green text-white font-black text-lg py-4 rounded-2xl hover:bg-green-700 transition-colors min-h-14"
          aria-label="Renew subscription"
          onClick={() => alert("Payment details ऊपर दिए गए हैं। UPI से pay करें। / Pay via UPI details shown above.")}
        >
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            {subscription ? "नवीनीकरण करें / Renew" : "₹199 Pay करें / Pay Now"}
          </span>
        </button>
      </div>

      {/* Payment history */}
      <div className="bg-white rounded-3xl border-2 border-border-light p-5">
        <h3
          className="font-bold text-text-primary mb-3"
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
