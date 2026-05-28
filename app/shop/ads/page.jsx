"use client";

import { useState, useEffect } from "react";
import {
  PlusCircle, X, Upload, CheckCircle, Eye,
  MousePointerClick, TrendingUp, Trash2, Megaphone,
  Tag, Loader2, Copy, Smartphone, ChevronLeft,
} from "lucide-react";
import CategorySelect from "@/components/CategorySelect";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { useRoleGuard } from "@/lib/auth/useRoleGuard";
import { useToast } from "@/components/Toast";
import { compressImage } from "@/lib/utils/compressImage";

const AD_TYPES = [
  { value: "banner",   hi: "Banner Ad",        en: "Full-width banner on category page", icon: Megaphone, tag: "Most Popular" },
  { value: "featured", hi: "Featured Listing",  en: "Shop listed at top of search results", icon: Tag, tag: "Best Value" },
];

const PRICE_PER_DAY = 100; // ₹100 / day flat
const MIN_DAYS = 1;
const MAX_DAYS = 90;

function CreateAdForm({ onCreated, onCancel }) {
  const toast = useToast();
  const [adType,    setAdType]    = useState("");
  const [category,  setCategory]  = useState("");
  const [days,      setDays]      = useState("7");      // string so the input is empty-friendly
  const [creative,  setCreative]  = useState(null);     // base64 string
  const [preview,   setPreview]   = useState(null);     // object URL for display
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [stage,     setStage]     = useState("form"); // "form" | "payment"

  const daysNum = parseInt(days, 10);
  const validDays = Number.isFinite(daysNum) && daysNum >= MIN_DAYS && daysNum <= MAX_DAYS;
  const totalCost = validDays ? daysNum * PRICE_PER_DAY : 0;

  async function handleCreativeUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await compressImage(file, { maxPx: 1200, quality: 0.75 });
      setPreview(URL.createObjectURL(file));
      setCreative(b64);
    } catch (err) {
      setPreview(null);
      setCreative(null);
      if (err.message === "IMAGE_TOO_BIG") {
        toast.error("फोटो का size बहुत बड़ा है / Image size is too big");
      } else {
        toast.error("Image upload failed. Try again.");
      }
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    if (!adType || !category) { toast.error("Ad type और category चुनें"); return; }
    if (!validDays) { toast.error(`Days must be between ${MIN_DAYS} and ${MAX_DAYS}`); return; }
    // Move to payment stage. The actual ad doesn't get created in the DB
    // until the shop confirms payment on the next screen.
    setStage("payment");
  }

  // Called from <AdPaymentScreen> after the shop hits "I have paid via UPI".
  // This is where the ad finally lands in the DB with status: "pending".
  // When PayU/Razorpay is wired in the future, the gateway's success
  // webhook will call this same code path instead of the manual button.
  async function confirmPayment() {
    setLoading(true);
    try {
      const token = localStorage.getItem("kaamsetu_token");
      const res = await fetch("/api/shop/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: adType, category, duration: daysNum, budget: totalCost, creative }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        toast.error(data.message || "Ad submit failed");
        setStage("form");
      }
    } catch {
      toast.error("Network error");
      setStage("form");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-3xl border-2 border-green-600 p-8 text-center">
        <CheckCircle size={56} className="text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-black text-brand-navy mb-2 font-hindi">Ad Submit हो गया!</h3>
        <p className="text-gray-500 text-sm mb-1 font-hindi">Admin review के बाद आपका ad live होगा।</p>
        <p className="text-gray-400 text-xs mb-6">Your ad will go live after admin review.</p>
        <button onClick={onCreated}
          className="w-full bg-brand-navy text-white font-black text-lg py-4 rounded-2xl hover:bg-blue-900 transition-colors font-hindi">
          ठीक है / Done
        </button>
      </div>
    );
  }

  if (stage === "payment") {
    return (
      <AdPaymentScreen
        amount={totalCost}
        days={daysNum}
        onPaid={confirmPayment}
        onBack={() => setStage("form")}
        submitting={loading}
      />
    );
  }

  const canSubmit = adType && category && validDays && !loading;

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-3xl border-2 border-brand-navy p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-brand-navy text-xl font-hindi">नया Ad बनाएं</h3>
          <p className="text-gray-500 text-sm">Create New Advertisement</p>
        </div>
        <button type="button" onClick={onCancel}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500">
          <X size={18} />
        </button>
      </div>

      {/* Ad type */}
      <FieldSection labelHi="Ad का प्रकार" labelEn="Ad Type *">
        <div className="space-y-3">
          {AD_TYPES.map(type => (
            <button key={type.value} type="button" onClick={() => setAdType(type.value)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                adType === type.value ? "border-brand-navy bg-blue-50" : "border-gray-200 hover:border-brand-navy"
              }`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                adType === type.value ? "bg-brand-navy text-white" : "bg-gray-100 text-gray-500"
              }`}>
                <type.icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-brand-navy font-hindi">{type.hi}</p>
                  {type.tag && (
                    <span className="text-xs bg-brand-yellow text-brand-navy font-bold px-2 py-0.5 rounded-full">{type.tag}</span>
                  )}
                </div>
                <p className="text-gray-500 text-sm">{type.en}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                adType === type.value ? "border-brand-navy bg-brand-navy" : "border-gray-200"
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

      {/* Category */}
      <FieldSection labelHi="Target Category" labelEn="Which category should this ad appear in? *">
        <CategorySelect value={category} onChange={setCategory} level="main"
          placeholder="-- Category चुनें / Select Category --" />
      </FieldSection>

      {/* Days + cost */}
      <FieldSection labelHi="Duration / कितने दिन" labelEn="How many days should the ad run? *">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="number"
              min={MIN_DAYS}
              max={MAX_DAYS}
              inputMode="numeric"
              placeholder="7"
              value={days}
              onChange={e => setDays(e.target.value.replace(/\D/g, "").slice(0, 3))}
              className="w-full pl-4 pr-16 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold font-hindi">दिन / days</span>
          </div>
        </div>
        {days && !validDays && (
          <p className="text-red-500 text-sm mt-2">Enter a number between {MIN_DAYS} and {MAX_DAYS}</p>
        )}
        <div className="mt-3 bg-brand-bg border-2 border-gray-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-hindi">रेट / Rate</p>
            <p className="text-sm font-bold text-brand-navy">₹{PRICE_PER_DAY} / day</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 font-hindi">कुल / Total</p>
            <p className="text-2xl font-black text-green-600">
              {validDays ? `₹${totalCost}` : "—"}
            </p>
            {validDays && (
              <p className="text-xs text-gray-400">{daysNum} × ₹{PRICE_PER_DAY}</p>
            )}
          </div>
        </div>
      </FieldSection>

      {/* Creative guidelines */}
      <div className="bg-yellow-50 border-2 border-brand-yellow rounded-2xl p-4">
        <p className="font-bold text-brand-navy text-sm mb-2 font-hindi">
          📐 Image Guidelines / इमेज नियम
        </p>
        <ul className="text-xs text-gray-700 space-y-1.5 leading-relaxed">
          <li>• <strong>Recommended size:</strong> 1200 × 400 px (banner aspect ~3:1)</li>
          <li>• <strong>Format:</strong> JPG or PNG, max 5 MB (auto-compressed)</li>
          <li>• <strong>Safe area:</strong> keep text & logo at least 50 px from each edge — edges may crop on small screens</li>
          <li>• <strong>Don't include phone numbers in the image</strong> — your shop's phone is shown next to the ad automatically</li>
          <li>• High-contrast, readable text works best on small phone screens</li>
        </ul>
      </div>

      {/* Creative */}
      <FieldSection labelHi="Ad Creative / विज्ञापन इमेज" labelEn="Upload banner image or logo (optional)">
        <label className="block cursor-pointer">
          {preview ? (
            <div className="relative rounded-2xl overflow-hidden border-2 border-brand-navy">
              <img src={preview} alt="Ad creative preview" className="w-full h-40 object-cover" />
              <button type="button"
                onClick={e => { e.preventDefault(); setPreview(null); setCreative(null); }}
                className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors">
                <X size={14} />
              </button>
              <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <CheckCircle size={12} /> Image uploaded
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-brand-navy transition-colors group">
              <Upload size={32} className="text-gray-400 mx-auto mb-3 group-hover:text-brand-navy transition-colors" />
              <p className="text-gray-500 font-semibold font-hindi">Banner / Logo Upload करें</p>
              <p className="text-gray-400 text-xs mt-1">PNG, JPG — compressed automatically</p>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleCreativeUpload} />
        </label>
      </FieldSection>

      {/* Summary */}
      {adType && category && validDays && (
        <div className="bg-brand-bg border-2 border-gray-200 rounded-2xl p-4 space-y-2 text-sm">
          <p className="font-bold text-brand-navy font-hindi">Ad Summary / सारांश</p>
          <SummaryRow label="Type"     value={AD_TYPES.find(t => t.value === adType)?.hi || adType} />
          <SummaryRow label="Category" value={category} />
          <SummaryRow label="Duration" value={`${daysNum} day${daysNum === 1 ? "" : "s"}`} />
          <SummaryRow label="Total"    value={`₹${totalCost}`} bold />
        </div>
      )}

      <button type="submit" disabled={!canSubmit}
        className="w-full bg-brand-navy text-white font-black text-xl py-5 rounded-2xl hover:bg-blue-900 transition-colors disabled:opacity-40 flex items-center justify-center gap-2 font-hindi">
        Payment / आगे बढ़ें {validDays && `· ₹${totalCost}`}
      </button>
    </form>
  );
}

// Manual UPI payment screen. Shown after the shop fills the form and
// before the ad lands in the DB. When PayU/Razorpay is wired later,
// this whole component gets replaced with a gateway redirect — the rest
// of the flow (onPaid -> confirmPayment -> POST /api/shop/ads) stays.
function AdPaymentScreen({ amount, days, onPaid, onBack, submitting }) {
  const toast = useToast();
  const [config, setConfig] = useState({ upiId: "", qrCodeUrl: "" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/payment-config")
      .then(r => r.json())
      .then(data => {
        if (data.success) setConfig({ upiId: data.upiId || "", qrCodeUrl: data.qrCodeUrl || "" });
      })
      .catch(() => {});
  }, []);

  function copyUpi() {
    if (!config.upiId) return;
    navigator.clipboard?.writeText(config.upiId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const upiDeepLink = config.upiId
    ? `upi://pay?pa=${encodeURIComponent(config.upiId)}&pn=KaamSetu&am=${amount}&cu=INR&tn=${encodeURIComponent(`Ad for ${days} days`)}`
    : null;

  return (
    <div className="bg-white rounded-3xl border-2 border-brand-navy p-6 space-y-5">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} disabled={submitting}
          className="flex items-center gap-1 text-gray-500 hover:text-brand-navy text-sm font-semibold disabled:opacity-40">
          <ChevronLeft size={16} /> Back
        </button>
        <h3 className="font-black text-brand-navy text-lg font-hindi">Payment</h3>
        <span className="w-12" /> {/* spacer for symmetry */}
      </div>

      {/* Amount headline */}
      <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 text-center">
        <p className="text-xs text-green-700 font-semibold uppercase tracking-wide">Amount due</p>
        <p className="text-5xl font-black text-green-700 mt-1">₹{amount}</p>
        <p className="text-xs text-gray-500 mt-1 font-hindi">
          {days} {days === 1 ? "day" : "days"} × ₹{PRICE_PER_DAY} per day
        </p>
      </div>

      {/* QR */}
      <div className="text-center">
        <p className="text-xs font-semibold text-gray-500 mb-2 font-hindi">QR Code scan करें / Scan QR</p>
        <div className="inline-block bg-white border-2 border-gray-200 rounded-2xl p-3">
          {config.qrCodeUrl ? (
            <img src={config.qrCodeUrl} alt="UPI QR" className="w-48 h-48 object-contain" />
          ) : (
            <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-xs text-center px-4">
              QR not set by admin yet — use UPI ID below
            </div>
          )}
        </div>
      </div>

      {/* UPI ID */}
      {config.upiId && (
        <div className="bg-brand-bg border-2 border-gray-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-500">UPI ID</p>
            <p className="font-bold text-brand-navy text-base truncate">{config.upiId}</p>
          </div>
          <button type="button" onClick={copyUpi}
            className="flex items-center gap-1.5 bg-brand-navy text-white font-semibold text-sm px-3 py-2 rounded-lg hover:opacity-90 flex-shrink-0">
            <Copy size={14} />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}

      {/* Mobile UPI app deep-link */}
      {upiDeepLink && (
        <a href={upiDeepLink}
          className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl hover:bg-blue-700 transition-colors">
          <Smartphone size={18} />
          <span className="font-hindi">UPI app में खोलें / Open in UPI app</span>
        </a>
      )}

      {/* Steps */}
      <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside bg-gray-50 rounded-xl p-3">
        <li>QR scan करें या UPI ID copy करके payment app में paste करें</li>
        <li>Exactly ₹{amount} pay करें</li>
        <li>Payment हो जाने पर नीचे "I have paid" button दबाएँ</li>
        <li>Admin verification के बाद आपका ad live हो जाएगा</li>
      </ol>

      {/* Confirm */}
      <button type="button" onClick={onPaid} disabled={submitting}
        className="w-full bg-green-600 text-white font-black text-lg py-4 rounded-2xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-hindi">
        {submitting
          ? (<><Loader2 size={20} className="animate-spin" /> Submit हो रहा है...</>)
          : (<><CheckCircle size={20} /> Payment हो गई / I have paid</>)}
      </button>

      <p className="text-[11px] text-gray-400 text-center">
        Auto payment verification coming soon. Right now admin manually approves.
      </p>
    </div>
  );
}

function AdStatusBadge({ status }) {
  const map = {
    active:   { hi: "चालू",    bg: "bg-green-50  text-green-700  border-green-200",  dot: "bg-green-600" },
    pending:  { hi: "Pending", bg: "bg-yellow-50 text-yellow-700 border-yellow-200", dot: "bg-brand-yellow" },
    rejected: { hi: "Rejected",bg: "bg-red-50    text-red-600    border-red-200",    dot: "bg-red-400" },
    expired:  { hi: "खत्म",   bg: "bg-gray-50   text-gray-500   border-gray-200",   dot: "bg-gray-400" },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${s.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      <span className="font-hindi">{s.hi}</span>
    </span>
  );
}

function ManagedAdCard({ ad, onDelete }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="font-bold text-brand-navy">{AD_TYPES.find(t => t.value === ad.type)?.hi || ad.type}</p>
            <AdStatusBadge status={ad.status} />
          </div>
          <p className="text-gray-500 text-sm">{ad.category} · {ad.duration} days · ₹{ad.budget}</p>
          {ad.reviewNote && (
            <p className="text-red-500 text-xs mt-1 font-hindi">Note: {ad.reviewNote}</p>
          )}
        </div>
        {["pending", "rejected", "expired"].includes(ad.status) && (
          <button onClick={() => onDelete(ad.id || ad._id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex-shrink-0">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {ad.creative && (
        <img src={ad.creative} alt="Ad creative" className="w-full h-28 object-cover rounded-xl mb-3" />
      )}

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
          <span className="font-hindi">खत्म</span>{" / Expires: "}
          <span className="font-semibold text-brand-navy">{ad.expiresAt ?? "—"}</span>
        </span>
        <span className="font-bold text-brand-navy text-sm">₹{ad.budget}</span>
      </div>
    </div>
  );
}

export default function ShopAdsPage() {
  useRoleGuard("shop");
  const toast = useToast();
  const [ads,      setAds]      = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [shopStatus, setShopStatus] = useState(null); // "approved" | "pending" | ...
  const isApproved = shopStatus === "approved";

  async function loadAds() {
    try {
      const token = localStorage.getItem("kaamsetu_token");
      const res  = await fetch("/api/shop/ads", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setAds(data.ads || []);
    } catch {}
    setLoading(false);
  }

  async function loadShopStatus() {
    try {
      const token = localStorage.getItem("kaamsetu_token");
      const res = await fetch("/api/shop/me", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success && data.shop) setShopStatus(data.shop.status);
    } catch {}
  }

  useEffect(() => { loadAds(); loadShopStatus(); }, []);

  async function handleCreated() {
    setShowForm(false);
    setLoading(true);
    await loadAds();
  }

  async function handleDelete(adId) {
    if (!confirm("इस ad को delete करें? / Delete this ad?")) return;
    try {
      const token = localStorage.getItem("kaamsetu_token");
      const res  = await fetch(`/api/shop/ads/${adId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setAds(prev => prev.filter(a => String(a.id || a._id) !== String(adId)));
        toast.success("Ad deleted");
      } else {
        toast.error(data.message || "Delete failed");
      }
    } catch {
      toast.error("Network error");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
        <div>
          <h2 className="text-xl font-black text-brand-navy font-hindi">Ads प्रबंधन</h2>
          <p className="text-gray-500 text-sm mt-0.5">Manage Advertisements · {ads.length} total</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} disabled={!isApproved}
            className="flex items-center gap-2 bg-brand-navy text-white font-bold px-5 py-3 rounded-xl hover:bg-blue-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <PlusCircle size={20} />
            <span className="font-hindi">नया Ad बनाएं / Create Ad</span>
          </button>
        )}
      </div>

      {shopStatus && !isApproved && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl px-4 py-3">
          <p className="text-sm font-semibold text-yellow-800 font-hindi">
            आपकी shop अभी admin approval का इंतज़ार कर रही है
          </p>
          <p className="text-xs text-yellow-700 mt-0.5">
            Your shop is pending admin approval. You can create ads once it's approved.
          </p>
        </div>
      )}

      {showForm && (
        <CreateAdForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />
      )}

      {!showForm && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AD_TYPES.map(type => (
            <div key={type.value} className="bg-white rounded-2xl border-2 border-gray-200 p-4 flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <type.icon size={20} className="text-brand-navy" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-brand-navy text-sm font-hindi">{type.hi}</p>
                  <span className="text-xs bg-brand-yellow text-brand-navy font-bold px-1.5 py-0.5 rounded-full">{type.tag}</span>
                </div>
                <p className="text-gray-500 text-xs">{type.en}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <h3 className="font-bold text-brand-navy mb-3 font-hindi">मेरे सभी Ads / All My Ads</h3>
        {loading ? (
          <LoadingSkeleton type="card" count={2} />
        ) : ads.length === 0 ? (
          <EmptyState icon="default"
            titleHi="अभी कोई Ad नहीं" titleEn="No ads created yet"
            descHi="ऊपर 'नया Ad बनाएं' पर click करके शुरू करें।" descEn="Click 'Create Ad' above to get started."
            action={!showForm ? { labelHi: "नया Ad बनाएं", labelEn: "Create New Ad", onClick: () => setShowForm(true) } : undefined}
          />
        ) : (
          <div className="space-y-4">
            {ads.map(ad => (
              <ManagedAdCard key={String(ad.id || ad._id)} ad={ad} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border-2 border-gray-200 p-5">
        <h3 className="font-black text-brand-navy mb-4 font-hindi">Pricing / कीमत</h3>
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-3 text-center">
          <p className="text-3xl font-black text-green-700">₹{PRICE_PER_DAY} <span className="text-base font-bold text-green-600">/ day</span></p>
          <p className="text-xs text-gray-500 mt-1 font-hindi">Flat rate — pick any duration from {MIN_DAYS} to {MAX_DAYS} days</p>
        </div>
        <div className="space-y-2 text-sm">
          {[
            { days: 1,   note: "Try it out / एक दिन" },
            { days: 7,   note: "One week / एक सप्ताह" },
            { days: 30,  note: "Monthly / महीना" },
            { days: 90,  note: "Best value / सबसे ज़्यादा reach" },
          ].map(row => (
            <div key={row.days} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="font-semibold text-brand-navy">{row.days} day{row.days === 1 ? "" : "s"}</p>
                <p className="text-gray-500 text-xs font-hindi">{row.note}</p>
              </div>
              <span className="font-bold text-green-600">₹{row.days * PRICE_PER_DAY}</span>
            </div>
          ))}
        </div>
        <p className="text-gray-400 text-xs mt-3">Payment via UPI · Admin review before ad goes live.</p>
      </div>
    </div>
  );
}

function FieldSection({ labelHi, labelEn, children }) {
  return (
    <div>
      <label className="block mb-2 font-semibold text-brand-navy">
        <span className="font-hindi">{labelHi}</span>
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
      <span className={bold ? "font-black text-brand-navy" : "font-semibold text-brand-navy"}>{value}</span>
    </div>
  );
}
