"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle, Settings, QrCode, Upload, CreditCard } from "lucide-react";
import { getSettings, updateSettings } from "@/lib/api/admin";
import { compressImage } from "@/lib/utils/compressImage";
import { useT } from "@/lib/i18n/useT";

export default function AdminSettingsPage() {
  const t = useT();
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Payment / QR card — kept as its own state (image upload + toggle don't fit
  // the react-hook-form text fields). Saved separately; the server merges, so it
  // won't clobber the platform-config fields above.
  const [paymentMode, setPaymentMode] = useState("qr");
  const [qrUrl, setQrUrl] = useState("");
  const [upiId, setUpiId] = useState("");
  const [note, setNote] = useState("");
  const [uploadingQr, setUploadingQr] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentSaved, setPaymentSaved] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    getSettings().then(data => {
      reset({
        subscriptionPrice: data.subscriptionPrice ?? 199,
        defaultRadius: data.defaultRadius ?? 5,
      });
      setPaymentMode(data.paymentMode === "razorpay" ? "razorpay" : "qr");
      setQrUrl(data.paymentQrUrl || "");
      setUpiId(data.paymentUpiId || "");
      setNote(data.paymentNote || "");
    });
  }, [reset]);

  async function onSubmit(data) {
    if (submitting) return;
    setSubmitting(true);
    setErrorMsg("");
    const payload = {
      subscriptionPrice: Number(data.subscriptionPrice),
      defaultRadius: Number(data.defaultRadius),
    };
    try {
      const res = await updateSettings(payload);
      // apiFetch throws on non-2xx, so reaching here means success unless the
      // wrapper returned an explicit failure flag.
      if (res && res.success === false) throw new Error(res.message || "Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      // Never leave the button stuck on "Saving…" — surface the failure.
      setErrorMsg(err?.message || t({ hi: 'सेव नहीं हो पाया, दोबारा कोशिश करें', en: 'Could not save. Please try again.' }));
    } finally {
      setSubmitting(false);
    }
  }

  async function onQrFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setPaymentError("");
    setUploadingQr(true);
    try {
      // Compress to an inline base64 image — same transport the rest of the app
      // uses. Higher quality so the QR stays crisp/scannable.
      const dataUrl = await compressImage(file, { maxPx: 900, quality: 0.85 });
      setQrUrl(dataUrl);
    } catch (err) {
      setPaymentError(
        err?.message === "IMAGE_TOO_BIG"
          ? t({ hi: 'तस्वीर बहुत बड़ी है', en: 'Image too large' })
          : t({ hi: 'तस्वीर लोड नहीं हुई', en: 'Could not load image' })
      );
    } finally {
      setUploadingQr(false);
    }
  }

  async function savePayment() {
    if (savingPayment) return;
    setSavingPayment(true);
    setPaymentError("");
    if (paymentMode === "qr" && !qrUrl) {
      setPaymentError(t({ hi: 'QR image ज़रूरी है', en: 'A QR image is required for QR mode' }));
      setSavingPayment(false);
      return;
    }
    try {
      const res = await updateSettings({
        paymentMode,
        paymentQrUrl: qrUrl,
        paymentUpiId: upiId.trim(),
        paymentNote: note.trim(),
      });
      if (res && res.success === false) throw new Error(res.message || "Save failed");
      setPaymentSaved(true);
      setTimeout(() => setPaymentSaved(false), 3000);
    } catch (err) {
      setPaymentError(err?.message || t({ hi: 'सेव नहीं हो पाया', en: 'Could not save' }));
    } finally {
      setSavingPayment(false);
    }
  }

  const qrMode = paymentMode === "qr";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1
          className="text-2xl font-black text-brand-navy"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          {t({ hi: 'सेटिंग्स', en: 'Settings' })}
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">{t({ hi: 'प्लेटफ़ॉर्म-व्यापी कॉन्फ़िगरेशन', en: 'Platform-wide configuration' })}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Platform config */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5">
          <h2
            className="font-black text-brand-navy mb-4 flex items-center gap-2"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            <Settings size={18} className="text-brand-navy" />
            {t({ hi: 'प्लेटफ़ॉर्म कॉन्फ़िग', en: 'Platform Config' })}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1.5">
                {t({ hi: 'सब्सक्रिप्शन शुल्क (₹)', en: 'Subscription Price (₹)' })}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                <input
                  type="number"
                  {...register("subscriptionPrice", {
                    required: t({ hi: 'ज़रूरी', en: 'Required' }),
                    min: { value: 1, message: t({ hi: '1 या उससे ज़्यादा होना चाहिए', en: 'Must be ≥ 1' }) },
                  })}
                  className="w-full border-2 border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm outline-none focus:border-blue-600 transition-colors"
                />
              </div>
              {errors.subscriptionPrice && <p className="text-red-500 text-xs mt-1">{errors.subscriptionPrice.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1.5">
                {t({ hi: 'डिफ़ॉल्ट सर्च दूरी (km)', en: 'Default Search Radius (km)' })}
              </label>
              <input
                type="number"
                {...register("defaultRadius", {
                  required: t({ hi: 'ज़रूरी', en: 'Required' }),
                  min: { value: 1, message: t({ hi: 'न्यूनतम 1 km', en: 'Min 1 km' }) },
                  max: { value: 50, message: t({ hi: 'अधिकतम 50 km', en: 'Max 50 km' }) },
                })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 transition-colors"
              />
              {errors.defaultRadius && <p className="text-red-500 text-xs mt-1">{errors.defaultRadius.message}</p>}
            </div>
          </div>
        </div>

        {errorMsg && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 bg-brand-navy text-white font-black px-8 py-3.5 rounded-2xl hover:bg-blue-900 transition-colors disabled:opacity-60"
        >
          {saved && <CheckCircle size={18} />}
          {submitting ? t({ hi: 'सेव हो रहा है...', en: 'Saving...' }) : saved ? t({ hi: 'सहेजा गया!', en: 'Saved!' }) : t({ hi: 'सेटिंग सहेजें', en: 'Save Settings' })}
        </button>
      </form>

      {/* Payment / QR card */}
      <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 space-y-5">
        <div>
          <h2
            className="font-black text-brand-navy flex items-center gap-2"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            <QrCode size={18} className="text-brand-navy" />
            {t({ hi: 'भुगतान / QR', en: 'Payment / QR' })}
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            {t({
              hi: 'Razorpay बंद होने पर users इस QR से UPI payment करेंगे और screenshot भेजेंगे।',
              en: 'While Razorpay is off, users pay via this QR and upload a screenshot for you to approve.',
            })}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4">
          <div>
            <p className="font-bold text-brand-navy text-sm flex items-center gap-1.5">
              <CreditCard size={15} /> {t({ hi: 'Manual QR मोड', en: 'Manual QR mode' })}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {qrMode
                ? t({ hi: 'चालू — Razorpay छिपा है', en: 'ON — Razorpay checkout is hidden' })
                : t({ hi: 'बंद — Razorpay gateway चालू है', en: 'OFF — Razorpay gateway is live' })}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={qrMode}
            onClick={() => setPaymentMode(qrMode ? "razorpay" : "qr")}
            className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${qrMode ? "bg-green-600" : "bg-gray-300"}`}
          >
            <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${qrMode ? "translate-x-6" : ""}`} />
          </button>
        </div>

        {/* QR image */}
        <div>
          <label className="block text-sm font-semibold text-brand-navy mb-1.5">
            {t({ hi: 'UPI QR image', en: 'UPI QR image' })}
          </label>
          <div className="flex items-start gap-4">
            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
              {qrUrl
                ? <img src={qrUrl} alt="Payment QR" className="w-full h-full object-contain" />
                : <QrCode size={32} className="text-gray-300" />}
            </div>
            <div className="flex-1">
              <label className="inline-flex items-center gap-2 cursor-pointer bg-brand-navy text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-blue-900 transition-colors">
                <Upload size={15} />
                {uploadingQr
                  ? t({ hi: 'लोड हो रहा है...', en: 'Loading…' })
                  : qrUrl ? t({ hi: 'बदलें', en: 'Replace' }) : t({ hi: 'QR अपलोड करें', en: 'Upload QR' })}
                <input type="file" accept="image/*" className="hidden" onChange={onQrFile} disabled={uploadingQr} />
              </label>
              <p className="text-[11px] text-gray-400 mt-2">
                {t({ hi: 'अपने UPI app से QR की photo/screenshot डालें।', en: 'Upload the QR photo/screenshot from your UPI app.' })}
              </p>
            </div>
          </div>
        </div>

        {/* UPI id */}
        <div>
          <label className="block text-sm font-semibold text-brand-navy mb-1.5">
            {t({ hi: 'UPI ID', en: 'UPI ID' })}
          </label>
          <input
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="karvia@upi"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 transition-colors"
          />
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-semibold text-brand-navy mb-1.5">
            {t({ hi: 'निर्देश (user को दिखेंगे)', en: 'Instructions (shown to payer)' })}
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t({ hi: 'जैसे: पैसे भेजने के बाद screenshot upload करें, approval में कुछ घंटे लग सकते हैं।', en: 'e.g. After paying, upload the screenshot. Approval may take a few hours.' })}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 transition-colors resize-none"
          />
        </div>

        {paymentError && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{paymentError}</p>
        )}

        <button
          type="button"
          onClick={savePayment}
          disabled={savingPayment || uploadingQr}
          className="flex items-center gap-2 bg-green-600 text-white font-black px-8 py-3.5 rounded-2xl hover:bg-green-700 transition-colors disabled:opacity-60"
        >
          {paymentSaved && <CheckCircle size={18} />}
          {savingPayment ? t({ hi: 'सेव हो रहा है...', en: 'Saving...' }) : paymentSaved ? t({ hi: 'सहेजा गया!', en: 'Saved!' }) : t({ hi: 'Payment सेटिंग सहेजें', en: 'Save Payment Settings' })}
        </button>
      </div>
    </div>
  );
}
