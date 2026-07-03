"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle, Settings } from "lucide-react";
import { getSettings, updateSettings } from "@/lib/api/admin";
import { useT } from "@/lib/i18n/useT";

export default function AdminSettingsPage() {
  const t = useT();
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    getSettings().then(data => {
      reset({
        subscriptionPrice: data.subscriptionPrice ?? 199,
        defaultRadius: data.defaultRadius ?? 5,
      });
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
    </div>
  );
}
