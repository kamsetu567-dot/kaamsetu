"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Send, CheckCircle, Bell } from "lucide-react";
import { broadcastNotification } from "@/lib/api/admin";
import { useT } from "@/lib/i18n/useT";

const AUDIENCE_OPTIONS = [
  { value: "all",     hi: "सभी यूज़र",          en: "All Users"        },
  { value: "workers", hi: "सभी वर्कर",          en: "All Workers"      },
  { value: "clients", hi: "सभी क्लाइंट",         en: "All Clients"      },
  { value: "free",    hi: "खाली वर्कर (Free)",   en: "Free Workers"     },
  { value: "working", hi: "व्यस्त वर्कर",        en: "Working Workers"  },
];

export default function AdminNotificationsPage() {
  const t = useT();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const CHANNEL_OPTIONS = [
    { value: "sms",       label: "SMS"       },
    { value: "whatsapp",  label: "WhatsApp"  },
    { value: "push",      label: t({ hi: 'पुश नोटिफिकेशन', en: 'Push Notification' }) },
  ];

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: { audience: "all", channels: ["sms"] },
  });

  const [resultMsg, setResultMsg] = useState("");

  async function onSubmit(data) {
    setSubmitting(true);
    let res;
    try {
      res = await broadcastNotification(data);
    } catch (err) {
      res = { success: false, message: err?.message || "Send failed" };
    }
    setSubmitting(false);
    // The broadcast route always saves to the in-app bell now, so any 2xx
    // means at least the bell entry landed even if every email bounced.
    if (res?.success !== false) {
      setSuccess(true);
      setResultMsg(res?.message || "");
      reset();
      setTimeout(() => { setSuccess(false); setResultMsg(""); }, 4000);
    } else {
      setResultMsg(res?.message || "Could not send notification");
      setTimeout(() => setResultMsg(""), 4000);
    }
  }

  const message = watch("message") ?? "";

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1
          className="text-2xl font-black text-brand-navy"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          {t({ hi: 'सूचनाएँ भेजें', en: 'Broadcast Notifications' })}
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">{t({ hi: 'प्लेटफ़ॉर्म यूज़र्स को SMS, WhatsApp या पुश नोटिफिकेशन भेजें', en: 'Send SMS, WhatsApp, or push notifications to platform users' })}</p>
      </div>

      <div className="bg-white rounded-3xl border-2 border-gray-200 p-5">
        {success ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={28} className="text-green-600" />
            </div>
            <p
              className="font-black text-brand-navy text-xl"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              {t({ hi: 'नोटिफिकेशन भेजी गई!', en: 'Notification sent!' })}
            </p>
            <p className="text-gray-500 text-sm">{resultMsg || t({ hi: 'नोटिफिकेशन सफलतापूर्वक भेजी गई।', en: 'Notification sent successfully.' })}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Audience */}
            <div>
              <label
                className="block text-sm font-semibold text-brand-navy mb-2"
                style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
              >
                {t({ hi: 'किसे भेजें', en: 'Audience' })}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {AUDIENCE_OPTIONS.map(o => {
                  const checked = watch("audience") === o.value;
                  return (
                    <label
                      key={o.value}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                        checked ? "border-brand-navy bg-blue-50" : "border-gray-200 hover:border-blue-200"
                      }`}
                    >
                      <input
                        type="radio"
                        value={o.value}
                        {...register("audience")}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${checked ? "border-brand-navy bg-brand-navy" : "border-gray-300"}`} />
                      <div>
                        <p
                          className="text-xs font-semibold text-brand-navy"
                          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                        >
                          {o.hi}
                        </p>
                        <p className="text-xs text-gray-500">{o.en}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Channels */}
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-2">
                {t({ hi: 'माध्यम', en: 'Channel' })}
              </label>
              <div className="flex flex-wrap gap-3">
                {CHANNEL_OPTIONS.map(c => (
                  <label key={c.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      value={c.value}
                      {...register("channels")}
                      className="w-4 h-4 accent-primary-navy"
                    />
                    <span className="text-sm text-brand-navy">{c.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-brand-navy" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
                  {t({ hi: 'संदेश', en: 'Message' })}
                </label>
                <span className="text-xs text-gray-500">{message.length}/160</span>
              </div>
              <textarea
                {...register("message", {
                  required: t({ hi: 'संदेश ज़रूरी है', en: 'Message is required' }),
                  maxLength: { value: 160, message: t({ hi: 'अधिकतम 160 अक्षर', en: 'Max 160 characters' }) },
                })}
                rows={4}
                placeholder={t({ hi: 'यहाँ अपना संदेश लिखें...', en: 'Write your message here...' })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 transition-colors resize-none"
                style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
              />
              {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
            </div>

            {resultMsg && !success && (
              <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{resultMsg}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-orange-500 text-white font-black px-8 py-3.5 rounded-2xl hover:bg-orange-600 transition-colors disabled:opacity-60 w-full justify-center"
            >
              <Send size={18} />
              {submitting ? t({ hi: 'भेज रहे हैं...', en: 'Sending...' }) : t({ hi: 'नोटिफिकेशन भेजें', en: 'Send Notification' })}
            </button>
          </form>
        )}
      </div>

      {/* Info box — now honest: bell entry is always written; email is
          best-effort; SMS/WhatsApp not yet connected. */}
      <div className="flex items-start gap-3 bg-blue-50 border-2 border-blue-200 rounded-2xl px-4 py-3">
        <Bell size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-blue-600 text-sm" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
          {t({
            hi: 'हर broadcast users के in-app bell में हमेशा save होता है। Email best-effort भेजी जाती है। SMS/WhatsApp gateways अभी connect नहीं हैं।',
            en: 'Every broadcast is always saved to the user in-app bell. Email is sent best-effort. SMS/WhatsApp gateways are not connected yet.',
          })}
        </p>
      </div>
    </div>
  );
}
