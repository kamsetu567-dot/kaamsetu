"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { PlusCircle, Tag, Trash2, CheckCircle } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { getOffers, createOffer, deleteOffer } from "@/lib/api/admin";
import { useT } from "@/lib/i18n/useT";

export default function AdminOffersPage() {
  const t = useT();
  const [offers, setOffers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    getOffers().then(setOffers);
  }, []);

  async function onSubmit(data) {
    setSubmitting(true);
    try {
      await createOffer(data);
      const fresh = await getOffers();
      setOffers(fresh);
    } catch {}
    setSubmitting(false);
    setSuccess(true);
    reset();
    setTimeout(() => { setSuccess(false); setShowForm(false); }, 2000);
  }

  async function handleDelete(id) {
    if (!confirm(t({ hi: 'इस ऑफर को डिलीट करें?', en: 'Delete this offer?' }))) return;
    try {
      await deleteOffer(id);
      setOffers(prev => prev.filter(o => String(o.id) !== String(id)));
    } catch {}
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-black text-brand-navy"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            {t({ hi: 'ऑफर', en: 'Offers' })}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{t({ hi: 'वर्कर्स के लिए डिस्काउंट ऑफर बनाएँ और मैनेज करें', en: 'Create and manage discount offers for workers' })}</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-brand-navy text-white font-bold px-4 py-2.5 rounded-xl hover:bg-blue-900 transition-colors text-sm"
        >
          <PlusCircle size={16} />
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{t({ hi: 'नया ऑफर', en: 'New Offer' })}</span>
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-3xl border-2 border-brand-navy p-5">
          <h2
            className="font-black text-brand-navy mb-4"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            {t({ hi: 'नया ऑफर बनाएं', en: 'Create New Offer' })}
          </h2>
          {success ? (
            <div className="flex items-center gap-3 py-4 text-green-600">
              <CheckCircle size={20} />
              <p className="font-bold">{t({ hi: 'ऑफर बनाया गया!', en: 'Offer created!' })}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-brand-navy mb-1.5">
                    {t({ hi: 'ऑफर का नाम', en: 'Offer Title' })}
                  </label>
                  <input
                    {...register("title", { required: t({ hi: 'नाम ज़रूरी है', en: 'Title is required' }) })}
                    placeholder={t({ hi: 'जैसे: Summer Special', en: 'e.g. Summer Special' })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 transition-colors"
                  />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-navy mb-1.5">
                    {t({ hi: 'कूपन कोड', en: 'Coupon Code' })}
                  </label>
                  <input
                    {...register("code", { required: t({ hi: 'कोड ज़रूरी है', en: 'Code is required' }) })}
                    placeholder={t({ hi: 'जैसे: SUMMER50', en: 'e.g. SUMMER50' })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 transition-colors uppercase"
                  />
                  {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-navy mb-1.5">
                    {t({ hi: 'डिस्काउंट (₹ या %)', en: 'Discount (₹ or %)' })}
                  </label>
                  <input
                    {...register("discount", { required: t({ hi: 'डिस्काउंट ज़रूरी है', en: 'Discount is required' }) })}
                    placeholder={t({ hi: 'जैसे: ₹50 या 25%', en: 'e.g. ₹50 or 25%' })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 transition-colors"
                  />
                  {errors.discount && <p className="text-red-500 text-xs mt-1">{errors.discount.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-navy mb-1.5">
                    {t({ hi: 'खत्म होने की तारीख़', en: 'Expiry Date' })}
                  </label>
                  <input
                    type="date"
                    {...register("expiresAt", { required: t({ hi: 'एक्सपायरी तारीख़ ज़रूरी है', en: 'Expiry date is required' }) })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 transition-colors"
                  />
                  {errors.expiresAt && <p className="text-red-500 text-xs mt-1">{errors.expiresAt.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-navy mb-1.5">
                  {t({ hi: 'विवरण', en: 'Description' })}
                </label>
                <textarea
                  {...register("description")}
                  rows={2}
                  placeholder={t({ hi: 'ऑफर का विवरण...', en: 'Offer details...' })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 transition-colors resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-green-600 text-white font-bold px-6 py-3 rounded-2xl hover:bg-green-700 transition-colors disabled:opacity-60"
                >
                  {submitting ? t({ hi: 'बना रहे हैं...', en: 'Creating...' }) : t({ hi: 'ऑफर बनाएं', en: 'Create Offer' })}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-brand-bg text-gray-500 font-bold px-6 py-3 rounded-2xl hover:bg-gray-200 transition-colors"
                >
                  {t({ hi: 'रद्द करें', en: 'Cancel' })}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Offers list */}
      <div className="bg-white rounded-3xl border-2 border-gray-200 p-5">
        <h2
          className="font-black text-brand-navy mb-4 flex items-center gap-2"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          <Tag size={18} className="text-orange-500" />
          {t({ hi: 'सक्रिय ऑफर', en: 'Active Offers' })}
        </h2>
        {offers.length === 0 ? (
          <EmptyState
            icon="default"
            titleHi="कोई Offer नहीं"
            titleEn="No offers yet"
            descHi="ऊपर बटन से नया offer बनाएं।"
            descEn="Create a new offer using the button above."
          />
        ) : (
          <div className="space-y-3">
            {offers.map(o => (
              <div key={o.id} className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-2xl hover:border-orange-500 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-brand-navy">{o.title}</span>
                    <span className="bg-brand-yellow text-brand-navy text-xs font-black px-2 py-0.5 rounded-full">{o.code}</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-0.5">{o.discount} {t({ hi: 'छूट', en: 'off' })} · {t({ hi: 'समाप्त:', en: 'Expires:' })} {o.expiresAt}</p>
                </div>
                <button
                  onClick={() => handleDelete(o.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  aria-label={t({ hi: 'ऑफर डिलीट करें', en: 'Delete offer' })}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
