"use client";

import { useState, useEffect } from "react";
import {
  PlusCircle, X, Upload, CheckCircle, Eye,
  MousePointerClick, TrendingUp, Trash2, Megaphone,
  Tag, Clock, ChevronDown,
} from "lucide-react";
import { useForm } from "react-hook-form";
import CategorySelect from "@/components/CategorySelect";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import Footer from "@/components/Footer";

// ─── Ad type options ────────────────────────────────────────────────
const AD_TYPES = [
  {
    value: "banner",
    hi: "Banner Ad",
    en: "Full-width banner on category page",
    icon: Megaphone,
    tag: "Most Popular",
  },
  {
    value: "featured",
    hi: "Featured Listing",
    en: "Shop listed at top of search results",
    icon: Tag,
    tag: "Best Value",
  },
];

const DURATION_OPTIONS = [
  { days: 30,  label: "30 दिन / days",  discount: null },
  { days: 60,  label: "60 दिन / days",  discount: "10% off" },
  { days: 90,  label: "90 दिन / days",  discount: "20% off" },
];

// ─── Inline creation form ────────────────────────────────────────────
function CreateAdForm({ onCreated, onCancel }) {
  const [adType, setAdType]         = useState("");
  const [category, setCategory]     = useState("");
  const [duration, setDuration]     = useState(30);
  const [creative, setCreative]     = useState(null); // preview URL
  const [submitted, setSubmitted]   = useState(false);
  const [loading, setLoading]       = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { budget: "" },
  });

  const budget = watch("budget");

  function handleCreativeUpload(e) {
    const file = e.target.files?.[0];
    if (file) setCreative(URL.createObjectURL(file));
  }

  async function onSubmit(data) {
    if (!adType || !category) return;
    setLoading(true);
    // TODO: Replace with real API call when backend is ready
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    setSubmitted(true);
  }

  // ── Success screen ──────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="bg-white rounded-3xl border-2 border-green-600 p-8 text-center">
        <CheckCircle size={56} className="text-green-600 mx-auto mb-4" />
        <h3
          className="text-xl font-black text-brand-navy mb-2"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          Ad Submit हो गया!
        </h3>
        <p className="text-gray-500 text-sm mb-1">
          Admin review के बाद आपका ad live होगा।
        </p>
        <p className="text-gray-500 text-xs mb-6">
          Your ad will go live after admin review.
        </p>
        <button
          onClick={onCreated}
          className="w-full bg-brand-navy text-white font-black text-lg py-4 rounded-2xl hover:bg-blue-900 transition-colors min-h-14"
          aria-label="Done"
        >
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            ठीक है / Done
          </span>
        </button>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-3xl border-2 border-brand-navy p-6 space-y-6">

      {/* Form header */}
      <div className="flex items-center justify-between">
        <div>
          <h3
            className="font-black text-brand-navy text-xl"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            नया Ad बनाएं
          </h3>
          <p className="text-gray-500 text-sm">Create New Advertisement</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500"
          aria-label="Cancel ad creation"
        >
          <X size={18} />
        </button>
      </div>

      {/* Step 1 — Ad type */}
      <FieldSection labelHi="Ad का प्रकार" labelEn="Ad Type *">
        <div className="space-y-3">
          {AD_TYPES.map(type => (
            <button
              key={type.value}
              type="button"
              onClick={() => setAdType(type.value)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                adType === type.value
                  ? "border-brand-navy bg-blue-50"
                  : "border-gray-200 hover:border-brand-navy"
              }`}
              aria-label={type.hi}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                adType === type.value ? "bg-brand-navy text-white" : "bg-gray-100 text-gray-500"
              }`}>
                <type.icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p
                    className="font-bold text-brand-navy"
                    style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                  >
                    {type.hi}
                  </p>
                  {type.tag && (
                    <span className="text-xs bg-brand-yellow text-brand-navy font-bold px-2 py-0.5 rounded-full">
                      {type.tag}
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm">{type.en}</p>
              </div>
              {/* Radio indicator */}
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                adType === type.value
                  ? "border-brand-navy bg-brand-navy"
                  : "border-gray-200"
              }`}>
                {adType === type.value && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </FieldSection>

      {/* Step 2 — Target category */}
      <FieldSection labelHi="Target Category" labelEn="Which category should this ad appear in? *">
        <CategorySelect
          value={category}
          onChange={setCategory}
          level="main"
          placeholder="-- Category चुनें / Select Category --"
        />
      </FieldSection>

      {/* Step 3 — Duration */}
      <FieldSection labelHi="Duration / अवधि" labelEn="How long should the ad run? *">
        <div className="grid grid-cols-3 gap-3">
          {DURATION_OPTIONS.map(opt => (
            <button
              key={opt.days}
              type="button"
              onClick={() => setDuration(opt.days)}
              className={`flex flex-col items-center py-3 px-2 rounded-2xl border-2 transition-all ${
                duration === opt.days
                  ? "border-brand-navy bg-blue-50 text-brand-navy"
                  : "border-gray-200 text-gray-500 hover:border-brand-navy"
              }`}
              aria-label={`${opt.days} days duration`}
            >
              <Clock size={16} className="mb-1" />
              <span
                className="font-bold text-sm text-center leading-tight"
                style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
              >
                {opt.label}
              </span>
              {opt.discount && (
                <span className="text-xs mt-1 text-green-600 font-semibold">{opt.discount}</span>
              )}
            </button>
          ))}
        </div>
      </FieldSection>

      {/* Step 4 — Budget */}
      <FieldSection labelHi="Budget / बजट" labelEn="How much do you want to spend? *">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">₹</span>
          <input
            {...register("budget", {
              required: "Budget जरूरी है / Budget is required",
              min: { value: 100, message: "Minimum ₹100" },
            })}
            type="number"
            min={100}
            inputMode="numeric"
            placeholder="500"
            className="w-full pl-10 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy"
            aria-label="Ad budget in rupees"
          />
        </div>
        {errors.budget && (
          <p className="text-red-500 text-sm mt-1">{errors.budget.message}</p>
        )}
        {budget && Number(budget) >= 100 && (
          <p className="text-gray-500 text-xs mt-1">
            {duration} days × estimated reach — Final amount: <span className="font-bold text-brand-navy">₹{budget}</span>
          </p>
        )}
      </FieldSection>

      {/* Step 5 — Creative upload */}
      <FieldSection labelHi="Ad Creative / विज्ञापन इमेज" labelEn="Upload banner image or logo (optional)">
        <label className="block cursor-pointer">
          {creative ? (
            <div className="relative rounded-2xl overflow-hidden border-2 border-brand-navy">
              <img
                src={creative}
                alt="Ad creative preview"
                className="w-full h-40 object-cover"
              />
              <button
                type="button"
                onClick={e => { e.preventDefault(); setCreative(null); }}
                className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                aria-label="Remove creative image"
              >
                <X size={14} />
              </button>
              <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <CheckCircle size={12} />
                Image uploaded
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-brand-navy transition-colors group">
              <Upload size={32} className="text-gray-400 mx-auto mb-3 group-hover:text-brand-navy transition-colors" />
              <p
                className="text-gray-500 font-semibold"
                style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
              >
                Banner / Logo Upload करें
              </p>
              <p className="text-gray-500 text-xs mt-1">PNG, JPG — max 2MB</p>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCreativeUpload}
            aria-label="Upload ad creative image"
          />
        </label>
      </FieldSection>

      {/* Summary box before submit */}
      {adType && category && budget && Number(budget) >= 100 && (
        <div className="bg-brand-bg border-2 border-gray-200 rounded-2xl p-4 space-y-2 text-sm">
          <p className="font-bold text-brand-navy">
            <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>Ad Summary / सारांश</span>
          </p>
          <SummaryRow label="Type" value={AD_TYPES.find(t => t.value === adType)?.hi || adType} />
          <SummaryRow label="Category" value={category} />
          <SummaryRow label="Duration" value={`${duration} days`} />
          <SummaryRow label="Budget" value={`₹${budget}`} bold />
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !adType || !category || !budget || Number(budget) < 100}
        className="w-full bg-brand-navy text-white font-black text-xl py-5 rounded-2xl hover:bg-blue-900 transition-colors disabled:opacity-40 min-h-16"
        aria-label="Submit ad for review"
      >
        {loading ? (
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            Submit हो रहा है...
          </span>
        ) : (
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            Ad Submit करें / Submit for Review
          </span>
        )}
      </button>
    </form>
  );
}

// ─── Status badge used in the ads list ──────────────────────────────
function AdStatusBadge({ status }) {
  const map = {
    active:  { hi: "चालू",   bg: "bg-green-50  text-green-700  border-green-200",  dot: "bg-green-600" },
    pending: { hi: "Pending", bg: "bg-yellow-50 text-yellow-700 border-yellow-200", dot: "bg-brand-yellow" },
    expired: { hi: "खत्म",   bg: "bg-red-50    text-red-600    border-red-200",    dot: "bg-red-400"       },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${s.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{s.hi}</span>
    </span>
  );
}

// ─── Ads management list card ────────────────────────────────────────
function ManagedAdCard({ ad, onDelete }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="font-bold text-brand-navy truncate">{ad.title}</p>
            <AdStatusBadge status={ad.status} />
          </div>
          <p className="text-gray-500 text-sm">{ad.type} · {ad.category}</p>
        </div>
        <button
          onClick={() => onDelete(ad.id)}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex-shrink-0"
          aria-label={`Delete ad ${ad.title}`}
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        {[
          { icon: Eye,               label: "Views",  val: ad.impressions ?? 0 },
          { icon: MousePointerClick, label: "Clicks", val: ad.clicks      ?? 0 },
          { icon: TrendingUp,        label: "CTR",    val: ad.ctr         ?? "0%" },
        ].map(m => (
          <div key={m.label} className="bg-brand-bg rounded-xl py-2.5">
            <m.icon size={14} className="text-gray-500 mx-auto mb-0.5" />
            <p className="font-black text-brand-navy text-base">{m.val}</p>
            <p className="text-xs text-gray-500">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-200 pt-3">
        <span>
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>खत्म</span>
          {" / Expires: "}
          <span className="font-semibold text-brand-navy">{ad.expiresAt ?? "—"}</span>
        </span>
        <span className="font-bold text-brand-navy text-sm">₹{ad.budget ?? "—"}</span>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────
export default function ShopAdsPage() {
  const [ads, setAds]             = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);

  useEffect(() => {
    // TODO: Replace with real API call when backend is ready
    setTimeout(() => { setAds([]); setLoading(false); }, 600);
  }, []);

  function handleCreated() {
    setShowForm(false);
    // In a real app, re-fetch ads list here
  }

  function handleDelete(adId) {
    // TODO: Persist via API when backend is ready — DELETE /ads/:id
    setAds(prev => prev.filter(a => a.id !== adId));
  }

  return (
    <>
      <div className="space-y-5">

        {/* Page header + create button */}
        <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
          <div>
            <h2
              className="text-xl font-black text-brand-navy"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              Ads प्रबंधन
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">
              Manage Advertisements · {ads.length} total
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-brand-navy text-white font-bold px-5 py-3 rounded-xl hover:bg-blue-900 transition-colors"
              aria-label="Create new ad"
            >
              <PlusCircle size={20} />
              <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>नया Ad बनाएं</span>
              <span>/ Create Ad</span>
            </button>
          )}
        </div>

        {/* Inline creation form — slides in above the list */}
        {showForm && (
          <CreateAdForm
            onCreated={handleCreated}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Ad type info cards — always visible as a reference */}
        {!showForm && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AD_TYPES.map(type => (
              <div
                key={type.value}
                className="bg-white rounded-2xl border-2 border-gray-200 p-4 flex items-start gap-3"
              >
                <div className="w-10 h-10 bg-navy-50 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <type.icon size={20} className="text-brand-navy" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p
                      className="font-bold text-brand-navy text-sm"
                      style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                    >
                      {type.hi}
                    </p>
                    <span className="text-xs bg-brand-yellow text-brand-navy font-bold px-1.5 py-0.5 rounded-full">
                      {type.tag}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs">{type.en}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ads list */}
        <div>
          <h3
            className="font-bold text-brand-navy mb-3"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            मेरे सभी Ads / All My Ads
          </h3>

          {loading ? (
            <LoadingSkeleton type="card" count={2} />
          ) : ads.length === 0 ? (
            <EmptyState
              icon="default"
              titleHi="अभी कोई Ad नहीं"
              titleEn="No ads created yet"
              descHi="ऊपर 'नया Ad बनाएं' पर click करके शुरू करें।"
              descEn="Click 'Create Ad' above to get started."
              action={!showForm ? {
                labelHi: "नया Ad बनाएं",
                labelEn: "Create New Ad",
                onClick: () => setShowForm(true),
              } : undefined}
            />
          ) : (
            <div className="space-y-4">
              {ads.map(ad => (
                <ManagedAdCard key={ad.id} ad={ad} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>

        {/* Pricing info */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5">
          <h3
            className="font-black text-brand-navy mb-4"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            Pricing / कीमत
          </h3>
          <div className="space-y-3 text-sm">
            {[
              { duration: "30 दिन / 30 days", price: "आपके budget के अनुसार", note: "Minimum ₹100" },
              { duration: "60 दिन / 60 days", price: "10% discount",           note: "More reach" },
              { duration: "90 दिन / 90 days", price: "20% discount",           note: "Best value" },
            ].map(row => (
              <div key={row.duration} className="flex items-center justify-between py-2.5 border-b border-gray-200 last:border-0">
                <div>
                  <p
                    className="font-semibold text-brand-navy"
                    style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                  >
                    {row.duration}
                  </p>
                  <p className="text-gray-500 text-xs">{row.note}</p>
                </div>
                <span className="font-bold text-green-600">{row.price}</span>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-xs mt-3">
            Payment via UPI · Admin review before ad goes live.
          </p>
        </div>

      </div>
      <Footer />
    </>
  );
}

// ─── Small helpers ───────────────────────────────────────────────────
function FieldSection({ labelHi, labelEn, children }) {
  return (
    <div>
      <label className="block mb-2 font-semibold text-brand-navy">
        <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{labelHi}</span>
        {labelEn && <span className="text-gray-500 font-normal text-sm"> / {labelEn}</span>}
      </label>
      {children}
    </div>
  );
}

function SummaryRow({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={bold ? "font-black text-brand-navy" : "font-semibold text-brand-navy"}>
        {value}
      </span>
    </div>
  );
}
