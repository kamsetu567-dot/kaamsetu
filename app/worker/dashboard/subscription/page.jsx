"use client";

import { useState, useEffect } from "react";
import { CreditCard, CheckCircle, AlertCircle, Loader2, QrCode, Upload, Clock, Copy } from "lucide-react";
import { useRoleGuard } from "@/lib/auth/useRoleGuard";
import { useToast } from "@/components/Toast";
import EmptyState from "@/components/EmptyState";
import SubscriptionCountdown from "@/components/SubscriptionCountdown";
import { loadRazorpay } from "@/lib/utils/loadRazorpay";
import { compressImage } from "@/lib/utils/compressImage";
import { createSubscription, verifyPayment, submitManualPayment, getMyManualPayment } from "@/lib/api/payments";

export default function WorkerSubscriptionPage() {
  useRoleGuard("worker");
  const toast = useToast();
  const [worker, setWorker] = useState(null);
  const [loaded, setLoaded] = useState(false);
  // null until the real admin-configured price loads, so we never flash a
  // hardcoded default (e.g. 199) before correcting to the actual value.
  const [price, setPrice] = useState(null);
  const [paying, setPaying] = useState(false);

  // Manual UPI-QR payment config + the worker's latest claim.
  const [payCfg, setPayCfg] = useState(null); // { paymentMode, paymentQrUrl, paymentUpiId, paymentNote }
  const [claim, setClaim] = useState(null);
  const [screenshot, setScreenshot] = useState(""); // base64 data URL
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadWorker() {
    const token = typeof window !== "undefined" ? localStorage.getItem("kaamsetu_token") : null;
    if (!token) { setLoaded(true); return; }
    try {
      const res = await fetch("/api/workers/me", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success && data.worker) setWorker(data.worker);
    } catch {} finally { setLoaded(true); }
  }

  async function loadClaim() {
    const c = await getMyManualPayment("subscription");
    setClaim(c);
  }

  useEffect(() => { loadWorker(); loadClaim(); }, []);

  // Admin-configurable price + payment mode/QR (from /api/settings/public)
  useEffect(() => {
    fetch("/api/settings/public")
      .then(r => r.json())
      .then(d => {
        if (d?.subscriptionPrice) setPrice(d.subscriptionPrice);
        setPayCfg({
          paymentMode: d?.paymentMode === "razorpay" ? "razorpay" : "qr",
          paymentQrUrl: d?.paymentQrUrl || "",
          paymentUpiId: d?.paymentUpiId || "",
          paymentNote: d?.paymentNote || "",
        });
      })
      .catch(() => setPayCfg({ paymentMode: "qr", paymentQrUrl: "", paymentUpiId: "", paymentNote: "" }));
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
        name: "Karvia",
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

  async function onScreenshotFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await compressImage(file, { maxPx: 1200, quality: 0.7 });
      setScreenshot(dataUrl);
    } catch (err) {
      toast.error(err?.message === "IMAGE_TOO_BIG"
        ? "तस्वीर बहुत बड़ी है / Image too large"
        : "तस्वीर load नहीं हुई / Couldn't load image");
    } finally {
      setUploading(false);
    }
  }

  async function submitManual() {
    if (submitting) return;
    if (!screenshot) { toast.error("पहले payment screenshot डालें / Please add a payment screenshot"); return; }
    setSubmitting(true);
    try {
      const res = await submitManualPayment({ purpose: "subscription", screenshotUrl: screenshot });
      if (res?.success) {
        toast.success("Payment submit हो गई! Admin approval का इंतज़ार करें। / Submitted! Waiting for admin approval.");
        setScreenshot("");
        await loadClaim();
      } else {
        toast.error(res?.message || "Submit नहीं हो पाया / Couldn't submit");
      }
    } catch (err) {
      toast.error(err?.message || "कुछ गड़बड़ हुई / Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function copyUpi() {
    const id = payCfg?.paymentUpiId;
    if (!id) return;
    navigator.clipboard?.writeText(id).then(
      () => toast.success("UPI ID copy हो गई / Copied"),
      () => {}
    );
  }

  const expiresAt = worker?.subscriptionExpiry;
  const isActive = expiresAt && new Date(expiresAt) > new Date();
  // "…" while the real price is still loading — avoids flashing a wrong number.
  const priceLabel = price == null ? "…" : price;
  const qrMode = payCfg?.paymentMode !== "razorpay"; // default to QR until config loads
  const pending = claim?.status === "pending_review";

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
        <p className="text-gray-500 text-sm mt-0.5">Subscription Plan — ₹{priceLabel}/month</p>
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
            <p className="text-3xl font-black text-green-600">₹{priceLabel}</p>
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
      {!payCfg ? (
        <div className="bg-gray-50 border-2 border-gray-200 rounded-3xl p-6 h-40 animate-pulse" />
      ) : qrMode ? (
        // ---- Manual UPI-QR flow ----
        pending ? (
          <div className="bg-blue-50 border-2 border-blue-500 rounded-3xl p-6 text-center">
            <Clock size={30} className="text-blue-600 mx-auto mb-2" />
            <p className="font-black text-blue-800" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
              Payment review में है
            </p>
            <p className="text-blue-700 text-sm mt-1">
              आपकी ₹{claim.amount} की payment admin approval का इंतज़ार कर रही है। Approve होते ही subscription active हो जाएगी।
            </p>
            <p className="text-blue-600/70 text-xs mt-2">Your ₹{claim.amount} payment is awaiting admin approval.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border-2 border-gray-200 p-6">
            <h3
              className="font-black text-brand-navy mb-2 flex items-center gap-2"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              <QrCode size={18} className="text-green-600" />
              QR से भुगतान करें / Pay via QR
            </h3>

            {claim?.status === "rejected" && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-4">
                पिछली payment reject हुई{claim.rejectReason ? `: ${claim.rejectReason}` : ""}. कृपया दोबारा सही screenshot भेजें.
              </p>
            )}

            {/* QR image */}
            {payCfg.paymentQrUrl ? (
              <div className="flex flex-col items-center mb-4">
                <img
                  src={payCfg.paymentQrUrl}
                  alt="UPI QR"
                  className="w-56 h-56 object-contain rounded-2xl border-2 border-gray-200 bg-white p-2"
                />
                <p className="text-2xl font-black text-green-600 mt-3">₹{priceLabel}</p>
                <p className="text-gray-500 text-xs">
                  {isActive ? "Renew — दिन आपकी validity में जुड़ेंगे" : "Scan करके UPI से भेजें"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3 mb-4">
                Admin ने अभी payment QR set नहीं किया है। कृपया थोड़ी देर बाद कोशिश करें या admin से संपर्क करें.
              </p>
            )}

            {/* UPI id */}
            {payCfg.paymentUpiId && (
              <button
                type="button"
                onClick={copyUpi}
                className="w-full flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 rounded-xl py-2.5 mb-4 text-sm font-semibold text-brand-navy hover:bg-gray-100 transition-colors"
              >
                <span>UPI ID: {payCfg.paymentUpiId}</span>
                <Copy size={14} className="text-gray-400" />
              </button>
            )}

            {/* Instructions */}
            {payCfg.paymentNote && (
              <p className="text-gray-600 text-sm bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 whitespace-pre-wrap">
                {payCfg.paymentNote}
              </p>
            )}

            {/* Screenshot upload + submit */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-semibold text-brand-navy mb-2" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
                Payment के बाद screenshot भेजें
              </p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {screenshot
                    ? <img src={screenshot} alt="Screenshot" className="w-full h-full object-cover" />
                    : <QrCode size={22} className="text-gray-300" />}
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer bg-brand-navy text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
                  <Upload size={15} />
                  {uploading ? "लोड हो रहा है…" : screenshot ? "बदलें / Change" : "Screenshot चुनें"}
                  <input type="file" accept="image/*" className="hidden" onChange={onScreenshotFile} disabled={uploading} />
                </label>
              </div>

              <button
                onClick={submitManual}
                disabled={submitting || uploading || !screenshot || !payCfg.paymentQrUrl}
                className="w-full bg-green-600 text-white font-black text-lg py-4 rounded-2xl hover:bg-green-700 transition-colors min-h-14 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting
                  ? <><Loader2 size={20} className="animate-spin" /> <span>Submitting…</span></>
                  : <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>मैंने Payment कर दी / I&apos;ve Paid</span>}
              </button>
              <p className="text-[11px] text-gray-400 text-center mt-3">
                Admin के approve करने पर subscription active होगी।
              </p>
            </div>
          </div>
        )
      ) : (
        // ---- Razorpay gateway (re-enabled by flipping paymentMode) ----
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
            disabled={paying || price == null}
            aria-label="Pay for subscription"
            className="w-full bg-green-600 text-white font-black text-lg py-4 rounded-2xl hover:bg-green-700 transition-colors min-h-14 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {paying ? (
              <><Loader2 size={20} className="animate-spin" /> <span>Processing…</span></>
            ) : (
              <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
                {isActive ? `₹${priceLabel} — नवीनीकरण करें / Renew` : `₹${priceLabel} Pay करें / Pay Now`}
              </span>
            )}
          </button>

          <p className="text-[11px] text-gray-400 text-center mt-3">
            🔒 Secured by Razorpay · UPI / Card / Netbanking
          </p>
        </div>
      )}

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
