"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSearch from "@/components/HeroSearch";
import WorkerCard from "@/components/WorkerCard";
import FilterPanel from "@/components/FilterPanel";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { search, saveSearchRequest } from "@/lib/api/search";
import { getWorkers } from "@/lib/api/workers";
import { useFilters } from "@/lib/context/FilterContext";
import { X } from "lucide-react";

function SaveRequestModal({ query, onClose }) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    await saveSearchRequest(query, { name, mobile });
    setSaved(true);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
        {saved ? (
          <div className="text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-xl font-black text-brand-navy" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
              Request Save हो गई!
            </p>
            <p className="text-gray-500 mt-1">हम जल्द call करेंगे / We will call you soon.</p>
            <button onClick={onClose} className="mt-4 bg-orange-500 text-white font-bold py-3 px-6 rounded-xl w-full">Close</button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-lg" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>Request Save करें</h3>
              <button onClick={onClose} aria-label="Close modal"><X size={20} /></button>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
                हम आपको जल्द call करेंगे / We will call you soon!
              </span>
            </p>
            <div className="space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="आपका नाम / Your Name" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500" />
              <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                <span className="px-3 py-3 bg-gray-50 border-r border-gray-200 text-gray-500 font-semibold">+91</span>
                <input value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Mobile Number" inputMode="numeric" className="flex-1 px-3 py-3 focus:outline-none" />
              </div>
              <button onClick={handleSave} disabled={!name || mobile.length !== 10} className="w-full bg-orange-500 text-white font-black py-3 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50">
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>Save करें / Save Request</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const router = useRouter();
  const { filters } = useFilters();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("workers");
  const [showModal, setShowModal] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Guests can't search workers — push them to choose a role / sign up first.
  // Workers don't hire, so send them to their dashboard.
  useEffect(() => {
    if (!localStorage.getItem("kaamsetu_token")) {
      router.replace("/auth/select-role");
      return;
    }
    try {
      const u = JSON.parse(localStorage.getItem("kaamsetu_user") || "{}");
      if (u.role === "worker") { router.replace("/worker/dashboard"); return; }
    } catch {}
    setAuthChecked(true);
  }, [router]);

  // Update URL in real-time while typing (replace, not push, to avoid history flood)
  const handleQueryChange = useCallback((q) => {
    const trimmed = q.trim();
    if (trimmed) {
      router.replace(`/search?q=${encodeURIComponent(trimmed)}`, { scroll: false });
    }
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    setLoading(true);
    Promise.all([search(query, filters), getWorkers({ ...filters, query })])
      .then(([, w]) => setWorkers(w))
      .finally(() => setLoading(false));
  }, [query, filters, authChecked]);

  if (!authChecked) return null;

  return (
    <>
      {/* Search bar */}
      <div className="bg-brand-navy py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <HeroSearch initialQuery={query} onQueryChange={handleQueryChange} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 w-full">
        {/* Tabs */}
        <div className="flex gap-3 mb-6 border-b border-gray-200">
          {[
            { key: "workers", hi: "वर्कर", en: "Workers" },
            { key: "categories", hi: "कैटेगरी", en: "Categories" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 px-1 font-bold text-lg border-b-2 transition-colors ${
                activeTab === tab.key ? "border-orange-500 text-orange-500" : "border-transparent text-gray-500"
              }`}
              aria-label={tab.en}
            >
              <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{tab.hi}</span>
              <span> / {tab.en}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-6">
          <FilterPanel className="w-64" />
          <div className="flex-1 min-w-0">
            {query && (
              <p className="text-gray-500 mb-4 break-words">
                <span
                  className="font-semibold text-brand-navy"
                  style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                >
                  &ldquo;{query}&rdquo;
                </span>
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}> के लिए results</span>
                <br className="sm:hidden" />
                <span className="text-xs block mt-0.5">Results for &ldquo;{query}&rdquo;</span>
              </p>
            )}
            {loading ? (
              <LoadingSkeleton type="card" count={3} />
            ) : workers.length === 0 ? (
              <EmptyState
                icon="search"
                titleHi="कोई वर्कर नहीं मिला"
                titleEn="No worker found"
                descHi="अपनी request save करें — हम आपको जल्द call करेंगे!"
                descEn="Save your request — we will call you soon!"
                action={{
                  labelHi: "Request Save करें",
                  labelEn: "Save My Request",
                  onClick: () => setShowModal(true),
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workers.map(w => <WorkerCard key={w.id} worker={w} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && <SaveRequestModal query={query} onClose={() => setShowModal(false)} />}
    </>
  );
}

export default function SearchPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
          <SearchResults />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
