"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle, Settings } from "lucide-react";
import { getSettings, updateSettings } from "@/lib/api/admin";

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    getSettings().then(data => {
      reset({
        subscriptionPrice: data.subscriptionPrice ?? 199,
        defaultRadius: data.defaultRadius ?? 5,
        smsJobAlert: data.smsTemplates?.jobAlert ?? "नई job आई है {category} में। KaamSetu app खोलें।",
        smsWelcome: data.smsTemplates?.welcome ?? "KaamSetu में आपका स्वागत है! आपकी profile अब live है।",
        smsSubscription: data.smsTemplates?.subscription ?? "आपकी subscription {days} दिनों के लिए active है।",
      });
    });
  }, [reset]);

  async function onSubmit(data) {
    setSubmitting(true);
    const payload = {
      subscriptionPrice: Number(data.subscriptionPrice),
      defaultRadius: Number(data.defaultRadius),
      smsTemplates: {
        jobAlert: data.smsJobAlert,
        welcome: data.smsWelcome,
        subscription: data.smsSubscription,
      },
    };
    await updateSettings(payload);
    setSubmitting(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1
          className="text-2xl font-black text-text-primary"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          सेटिंग्स / Settings
        </h1>
        <p className="text-text-secondary text-sm mt-0.5">Platform-wide configuration</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Platform config */}
        <div className="bg-white rounded-3xl border-2 border-border-light p-5">
          <h2
            className="font-black text-text-primary mb-4 flex items-center gap-2"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            <Settings size={18} className="text-primary-navy" />
            Platform Config / Platform सेटिंग
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">
                Subscription Price (₹) / Subscription शुल्क
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-bold">₹</span>
                <input
                  type="number"
                  {...register("subscriptionPrice", {
                    required: "Required",
                    min: { value: 1, message: "Must be ≥ 1" },
                  })}
                  className="w-full border-2 border-border-light rounded-xl pl-8 pr-4 py-3 text-sm outline-none focus:border-primary-blue transition-colors"
                />
              </div>
              {errors.subscriptionPrice && <p className="text-red-500 text-xs mt-1">{errors.subscriptionPrice.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">
                Default Search Radius (km) / खोज दूरी
              </label>
              <input
                type="number"
                {...register("defaultRadius", {
                  required: "Required",
                  min: { value: 1, message: "Min 1 km" },
                  max: { value: 50, message: "Max 50 km" },
                })}
                className="w-full border-2 border-border-light rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-blue transition-colors"
              />
              {errors.defaultRadius && <p className="text-red-500 text-xs mt-1">{errors.defaultRadius.message}</p>}
            </div>
          </div>
        </div>

        {/* SMS templates */}
        <div className="bg-white rounded-3xl border-2 border-border-light p-5">
          <h2
            className="font-black text-text-primary mb-1"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            SMS Templates
          </h2>
          <p className="text-text-secondary text-xs mb-4">Use {"{variable}"} for dynamic values</p>
          <div className="space-y-4">
            {[
              { name: "smsJobAlert",     label: "Job Alert SMS",          hi: "Job Alert SMS" },
              { name: "smsWelcome",      label: "Welcome / Approval SMS",  hi: "Welcome SMS" },
              { name: "smsSubscription", label: "Subscription Active SMS", hi: "Subscription SMS" },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-sm font-semibold text-text-primary mb-1.5">
                  <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{f.hi}</span>
                  {" / "}{f.label}
                </label>
                <textarea
                  {...register(f.name)}
                  rows={2}
                  className="w-full border-2 border-border-light rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-blue transition-colors resize-none"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 bg-primary-navy text-white font-black px-8 py-3.5 rounded-2xl hover:bg-blue-900 transition-colors disabled:opacity-60"
        >
          {saved && <CheckCircle size={18} />}
          {submitting ? "Saving..." : saved ? "Saved! / सहेजा!" : "Save Settings / सहेजें"}
        </button>
      </form>
    </div>
  );
}
