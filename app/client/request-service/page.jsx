"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CheckCircle, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useToast } from "@/components/Toast";
import { CATEGORIES } from "@/lib/data/categories";
import { useRoleGuard } from "@/lib/auth/useRoleGuard";

function RequestForm() {
  useRoleGuard("client");
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const preCategory = searchParams.get("category") || "";

  const [currentUser, setCurrentUser] = useState(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(preCategory);
  const [subcategory, setSubcategory] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState("form"); // "form" | "searching" | "success"
  const [searchProgress, setSearchProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  const selectedCategoryData = CATEGORIES.find(c => c.id === category);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); },
      () => {} // silent fail — city text match is the fallback
    );
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("kaamsetu_user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setCurrentUser(user);
          if (user.name) setName(user.name);
        } catch {}
      }
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { toast.error("नाम डालें"); return; }
    if (!category) { toast.error("Category चुनें"); return; }
    if (!city.trim()) { toast.error("शहर डालें"); return; }
    if (submitting) return;

    setSubmitting(true);
    setStage("searching");
    setSearchProgress(0);

    let p = 0;
    const interval = setInterval(() => {
      p += 4;
      setSearchProgress(Math.min(p, 95));
      if (p >= 95) clearInterval(interval);
    }, 200);

    try {
      const token = localStorage.getItem("kaamsetu_token");
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          clientMobile: currentUser?.mobile,
          clientName: name,
          clientId: currentUser?.id || null,
          category,
          subcategory,
          location: area,
          city,
          description,
          source: "search",
          ...(lat && lng ? { lat, lng } : {}),
        }),
      });
      const data = await res.json();
      clearInterval(interval);
      if (!res.ok) { toast.error(data.message || "Request नहीं भेजी गई"); setStage("form"); setSearchProgress(0); return; }
      setSearchProgress(100);
      setTimeout(() => {
        setStage("success");
        setTimeout(() => router.push("/client/dashboard"), 2500);
      }, 300);
    } catch {
      clearInterval(interval);
      setStage("form");
      setSearchProgress(0);
      toast.error("Request नहीं भेजी गई। फिर try करें");
    } finally {
      setSubmitting(false);
    }
  }

  if (stage === "searching") {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 bg-brand-navy rounded-full flex items-center justify-center mb-6">
          <Loader2 size={40} className="text-brand-yellow animate-spin" />
        </div>
        <h2 className="text-2xl font-black text-brand-navy mb-2 text-center font-hindi">
          नज़दीकी वर्कर ढूंढ रहे हैं...
        </h2>
        <p className="text-gray-400 mb-6 text-center text-sm">Searching nearby workers...</p>
        <div className="w-full max-w-xs bg-gray-100 rounded-full h-3 overflow-hidden">
          <div className="h-3 bg-brand-navy rounded-full transition-all duration-200" style={{ width: `${searchProgress}%` }} />
        </div>
        <p className="text-brand-navy font-bold mt-2">{searchProgress}%</p>
      </div>
    );
  }

  if (stage === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <CheckCircle size={72} className="text-green-500 mb-4" />
        <h2 className="text-2xl font-black text-brand-navy mb-3 font-hindi">✅ Request Send हो गई!</h2>
        <p className="text-gray-500 font-hindi mb-1">पहला worker accept करते ही आपको call आएगी।</p>
        <p className="text-gray-400 text-sm">First available worker will call you right away!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">नाम *</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="आपका नाम / Your Name"
          className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base" />
      </div>

      {currentUser && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <p className="text-green-700 font-semibold text-sm">✅ +91 {currentUser.mobile} — Logged in</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 font-hindi">Category *</label>
        <select value={category} onChange={e => { setCategory(e.target.value); setSubcategory(''); }}
          className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base bg-white">
          <option value="">-- Category चुनें --</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.nameHi} / {c.nameEn}</option>)}
        </select>
      </div>

      {selectedCategoryData?.subcategories?.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">Subcategory (optional)</label>
          <select value={subcategory} onChange={e => setSubcategory(e.target.value)}
            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base bg-white">
            <option value="">-- चुनें --</option>
            {selectedCategoryData.subcategories.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">शहर *</label>
          <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="City"
            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-sm" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">एरिया</label>
          <input type="text" value={area} onChange={e => setArea(e.target.value)} placeholder="Area (optional)"
            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">नोट्स (optional)</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          rows={3} placeholder="कोई विशेष जानकारी / Any special requirements..."
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base resize-none font-hindi" />
      </div>

      <button type="submit" disabled={submitting}
        className="w-full bg-brand-navy text-white font-black text-xl py-5 rounded-2xl hover:bg-brand-navy-dark transition-colors disabled:opacity-50 font-hindi">
        Worker ढूंढें / Find Worker
      </button>
    </form>
  );
}

export default function RequestServicePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-brand-bg">
        <div className="bg-brand-navy px-4 py-8">
          <div className="max-w-lg mx-auto">
            <Link href="/client/dashboard" className="text-white/70 hover:text-white flex items-center gap-1 mb-3 w-fit text-sm">
              <ChevronLeft size={18} /> वापस / Back
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-white font-hindi">काम करवाओ</h1>
            <p className="text-white/60 text-sm">Hire a Worker — Fast!</p>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
              <RequestForm />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
