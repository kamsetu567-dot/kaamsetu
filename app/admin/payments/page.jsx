"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle, Upload, CreditCard } from "lucide-react";
import { getPaymentSettings, updatePaymentSettings } from "@/lib/api/admin";
import { useT } from "@/lib/i18n/useT";

export default function AdminPaymentsPage() {
  const t = useT();
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [qrPreview, setQrPreview] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    getPaymentSettings().then(data => {
      reset({
        upiId: data.upiId ?? "",
        bankName: data.bankDetails?.bankName ?? "",
        accountNumber: data.bankDetails?.accountNumber ?? "",
        ifsc: data.bankDetails?.ifsc ?? "",
        accountHolder: data.bankDetails?.accountHolder ?? "",
      });
      if (data.qrCodeUrl) setQrPreview(data.qrCodeUrl);
    });
  }, [reset]);

  async function onSubmit(data) {
    setSubmitting(true);
    await updatePaymentSettings(data);
    // TODO: Also upload QR code file to storage when backend is ready
    setSubmitting(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleQrChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setQrPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1
          className="text-2xl font-black text-brand-navy"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          {t({ hi: 'भुगतान सेटिंग', en: 'Payment Settings' })}
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">{t({ hi: 'वर्कर सब्सक्रिप्शन के लिए UPI ID, QR कोड और बैंक विवरण कॉन्फ़िगर करें', en: 'Configure UPI ID, QR code, and bank details for worker subscriptions' })}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* UPI */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5">
          <h2
            className="font-black text-brand-navy mb-4 flex items-center gap-2"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            <CreditCard size={18} className="text-blue-600" />
            {t({ hi: 'UPI विवरण', en: 'UPI Details' })}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1.5">
                {t({ hi: 'UPI ID', en: 'UPI ID' })}
              </label>
              <input
                {...register("upiId", { required: t({ hi: 'UPI ID ज़रूरी है', en: 'UPI ID required' }) })}
                placeholder={t({ hi: 'yourname@upi', en: 'yourname@upi' })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 transition-colors"
              />
              {errors.upiId && <p className="text-red-500 text-xs mt-1">{errors.upiId.message}</p>}
            </div>

            {/* QR code upload */}
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1.5">
                {t({ hi: 'QR कोड इमेज', en: 'QR Code Image' })}
              </label>
              <div className="flex items-start gap-4">
                {qrPreview ? (
                  <div className="relative w-28 h-28 flex-shrink-0">
                    <img src={qrPreview} alt={t({ hi: 'QR कोड', en: 'QR Code' })} className="w-full h-full object-contain border-2 border-gray-200 rounded-xl" />
                    <button
                      type="button"
                      onClick={() => setQrPreview(null)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-28 h-28 flex-shrink-0 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center bg-brand-bg text-gray-500">
                    <Upload size={24} />
                  </div>
                )}
                <label className="flex items-center gap-2 bg-brand-bg border-2 border-gray-200 text-brand-navy text-sm font-semibold px-4 py-2.5 rounded-xl cursor-pointer hover:border-blue-600 transition-colors">
                  <Upload size={16} />
                  {t({ hi: 'QR अपलोड करें', en: 'Upload QR' })}
                  <input type="file" accept="image/*" onChange={handleQrChange} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Bank details */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5">
          <h2
            className="font-black text-brand-navy mb-4"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            {t({ hi: 'बैंक विवरण', en: 'Bank Details' })}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: "accountHolder", label: t({ hi: 'खाताधारक का नाम', en: 'Account Holder Name' }), placeholder: t({ hi: 'बैंक में जैसा पूरा नाम है', en: 'Full name as on bank' }) },
              { name: "bankName",      label: t({ hi: 'बैंक का नाम', en: 'Bank Name' }),               placeholder: t({ hi: 'जैसे: State Bank of India', en: 'e.g. State Bank of India' }) },
              { name: "accountNumber", label: t({ hi: 'खाता संख्या', en: 'Account Number' }),         placeholder: t({ hi: '12 अंकों का खाता नंबर', en: '12-digit account number' }) },
              { name: "ifsc",          label: t({ hi: 'IFSC कोड', en: 'IFSC Code' }),                  placeholder: t({ hi: 'जैसे: SBIN0001234', en: 'e.g. SBIN0001234' }) },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-sm font-semibold text-brand-navy mb-1.5">{f.label}</label>
                <input
                  {...register(f.name)}
                  placeholder={f.placeholder}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 transition-colors"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 bg-brand-navy text-white font-black px-8 py-3.5 rounded-2xl hover:bg-blue-900 transition-colors disabled:opacity-60"
        >
          {saved ? <CheckCircle size={18} /> : null}
          {submitting ? t({ hi: 'सेव हो रहा है...', en: 'Saving...' }) : saved ? t({ hi: 'सहेजा गया!', en: 'Saved!' }) : t({ hi: 'सेटिंग सहेजें', en: 'Save Settings' })}
        </button>
      </form>
    </div>
  );
}
