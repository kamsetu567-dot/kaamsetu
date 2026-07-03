"use client";

import { useState, useEffect } from "react";
import { CreditCard, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useRoleGuard } from "@/lib/auth/useRoleGuard";
import { useToast } from "@/components/Toast";
import EmptyState from "@/components/EmptyState";
import SubscriptionCountdown from "@/components/SubscriptionCountdown";
import { loadRazorpay } from "@/lib/utils/loadRazorpay";
import { createSubscription, verifyPayment } from "@/lib/api/payments";

export default function WorkerSubscriptionPage() {
  useRoleGuard("worker");
  const toast = useToast();
  const [worker, setWorker] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [price, setPrice] = useState(199);
  const [paying, setPaying] = useState(false);

  async function loadWorker() {
    const token = typeof window !== "undefined" ? localStorage.getItem("kaamsetu_token") : null;
    if (!token) { setLoaded(true); return; }
    try {
      const res = await fetch("/api/workers/me", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success && data.worker) setWorker(data.worker);
    } catch {} finally { setLoaded(true); }
  }

  useEffect(() => { loadWorker(); }, []);

  // Admin-configurable subscription price (from /api/settings/public)
  useEffect(() => {
    fetch("/api/settings/public")
      .then(r => r.json())
      .then(d => { if (d?.subscriptionPrice) setPrice(d.subscriptionPrice); })
      .catch(() => {});
  }, []);

  async function handlePay() {
    if (paying) return;
    setPaying(true);
    try {
      const sdkOk = await loadRazorpay();
      if (!sdkOk) { toast.error("Payment SDK load नहीं हुआ / Couldn't load payment. Check your connection."); return; }

      const order = await createSubscription();
      if (!order?.orderId) { toast.error(order?.message || "Payment शुरू नहीं हो पाई / Could not start payment"); return; }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amountPaise,
        currency: order.currency,
        name: "KaamSetu",
        description: `Worker Subscription — ${order.amount} ₹ / month`,
        order_id: order.orderId,
        prefill: { name: worker?.name || "", contact: worker?.mobile || "" },
        theme: { color: "#0f172a" },
        handler: async (resp) => {
          try {
            const v = await verifyPayment({
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            });
            if (v?.success) {
              toast.success("Subscription activate हो गई! / Subscription activated!");
              await loadWorker();
            } else {
              toast.error(v?.message || "Verification failed. Contact support if charged.");
            }
          } catch {
            toast.error("Verification error. If money was deducted, contact support.");
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.on("payment.failed", (resp) => {
        toast.error(resp?.error?.description || "Payment failed. Please try again.");
      });
      rzp.open();
    } catch {
      toast.error("कुछ गड़बड़ हुई / Something went wrong. Please try again.");
    } finally {
      setPaying(false);
    }
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
        <p className="text-gray-500 text-sm mt-0.5">Subscription Plan — ₹{price}/month</p>
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
            <p className="text-3xl font-black text-green-600">₹{price}</p>
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

      {/* Payment section — Razorpay */}
      <div className="bg-white rounded-3xl border-2 border-gray-200 p-6">
        <h3
          className="font-black text-brand-navy mb-2 flex items-center gap-2"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          <CreditCard size={18} className="text-green-600" />
          भुगतान करें / Make Payment
        </h3>
        <p className="text-gray-500 text-sm mb-5">
          {isActive
            ? "अभी renew करने पर दिन आपकी मौजूदा validity में जुड़ जाएंगे। / Renewing now adds days on top of your current validity."
            : "Secure payment via UPI, card, or netbanking. Subscription instantly activate होगी।"}
        </p>

        <button
          onClick={handlePay}
          disabled={paying}
          aria-label="Pay for subscription"
          className="w-full bg-green-600 text-white font-black text-lg py-4 rounded-2xl hover:bg-green-700 transition-colors min-h-14 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {paying ? (
            <><Loader2 size={20} className="animate-spin" /> <span>Processing…</span></>
          ) : (
            <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
              {isActive ? `₹${price} — नवीनीकरण करें / Renew` : `₹${price} Pay करें / Pay Now`}
            </span>
          )}
        </button>

        <p className="text-[11px] text-gray-400 text-center mt-3">
          🔒 Secured by Razorpay · UPI / Card / Netbanking
        </p>
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
