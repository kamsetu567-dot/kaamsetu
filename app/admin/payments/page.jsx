"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle, Upload, CreditCard } from "lucide-react";
import { getPaymentSettings, updatePaymentSettings } from "@/lib/api/admin";

export default function AdminPaymentsPage() {
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
          className="text-2xl font-black text-text-primary"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          भुगतान सेटिंग / Payment Settings
        </h1>
        <p className="text-text-secondary text-sm mt-0.5">Configure UPI ID, QR code, and bank details for worker subscriptions</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* UPI */}
        <div className="bg-white rounded-3xl border-2 border-border-light p-5">
          <h2
            className="font-black text-text-primary mb-4 flex items-center gap-2"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            <CreditCard size={18} className="text-primary-blue" />
            UPI Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">
                UPI ID
              </label>
              <input
                {...register("upiId", { required: "UPI ID required" })}
                placeholder="yourname@upi"
                className="w-full border-2 border-border-light rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-blue transition-colors"
              />
              {errors.upiId && <p className="text-red-500 text-xs mt-1">{errors.upiId.message}</p>}
            </div>

            {/* QR code upload */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">
                QR Code Image / QR कोड
              </label>
              <div className="flex items-start gap-4">
                {qrPreview ? (
                  <div className="relative w-28 h-28 flex-shrink-0">
                    <img src={qrPreview} alt="QR Code" className="w-full h-full object-contain border-2 border-border-light rounded-xl" />
                    <button
                      type="button"
                      onClick={() => setQrPreview(null)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-28 h-28 flex-shrink-0 border-2 border-dashed border-border-light rounded-xl flex items-center justify-center bg-neutral-bg text-text-secondary">
                    <Upload size={24} />
                  </div>
                )}
                <label className="flex items-center gap-2 bg-neutral-bg border-2 border-border-light text-text-primary text-sm font-semibold px-4 py-2.5 rounded-xl cursor-pointer hover:border-primary-blue transition-colors">
                  <Upload size={16} />
                  Upload QR
                  <input type="file" accept="image/*" onChange={handleQrChange} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Bank details */}
        <div className="bg-white rounded-3xl border-2 border-border-light p-5">
          <h2
            className="font-black text-text-primary mb-4"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            Bank Details / बैंक जानकारी
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: "accountHolder", label: "Account Holder Name", placeholder: "Full name as on bank" },
              { name: "bankName",      label: "Bank Name",           placeholder: "e.g. State Bank of India" },
              { name: "accountNumber", label: "Account Number",      placeholder: "12-digit account number" },
              { name: "ifsc",          label: "IFSC Code",           placeholder: "e.g. SBIN0001234" },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-sm font-semibold text-text-primary mb-1.5">{f.label}</label>
                <input
                  {...register(f.name)}
                  placeholder={f.placeholder}
                  className="w-full border-2 border-border-light rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-blue transition-colors"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 bg-primary-navy text-white font-black px-8 py-3.5 rounded-2xl hover:bg-blue-900 transition-colors disabled:opacity-60"
        >
          {saved ? <CheckCircle size={18} /> : null}
          {submitting ? "Saving..." : saved ? "Saved! / सहेजा गया!" : "Save Settings / सहेजें"}
        </button>
      </form>
    </div>
  );
}
