"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WorkerCard from "@/components/WorkerCard";
import FilterPanel from "@/components/FilterPanel";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton, { WorkerCardSkeleton } from "@/components/LoadingSkeleton";
import { useFilters } from "@/lib/context/FilterContext";
import { getWorkers } from "@/lib/api/workers";

function SaveRequestModal({ onClose }) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [saved, setSaved] = useState(false);

  if (saved) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-xl font-black text-text-primary mb-2" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            Request Save हो गई!
          </p>
          <p className="text-text-secondary text-sm mb-5">हम जल्द call करेंगे / We will call you soon.</p>
          <button onClick={onClose} className="w-full bg-primary-orange text-white font-bold py-3 rounded-xl">
            <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>ठीक है / OK</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
        <h3 className="font-black text-xl mb-1 text-text-primary" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
          Request Save करें
        </h3>
        <p className="text-text-secondary text-sm mb-5">
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            हम आपको जल्द call करेंगे!
          </span>
          {" / We will contact you soon!"}
        </p>
        <div className="space-y-3">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="आपका नाम / Your Name"
            className="w-full px-4 py-4 border-2 border-border-light rounded-xl focus:outline-none focus:border-primary-orange text-base"
          />
          <div className="flex items-center border-2 border-border-light rounded-xl overflow-hidden focus-within:border-primary-orange">
            <span className="px-4 py-4 bg-gray-50 border-r-2 border-border-light text-text-secondary font-semibold">+91</span>
            <input
              value={mobile}
              onChange={e => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="मोबाइल नंबर"
              inputMode="numeric"
              className="flex-1 px-4 py-4 focus:outline-none text-base"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 border-2 border-border-light text-text-secondary font-bold py-3 rounded-xl hover:border-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => name && mobile.length === 10 && setSaved(true)}
              disabled={!name || mobile.length !== 10}
              className="flex-1 bg-primary-orange text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>Save करें</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkerList() {
  const searchParams = useSearchParams();
  const { filters, updateFilters } = useFilters();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Pre-fill filters from URL params (e.g. from /categories/[slug])
  useEffect(() => {
    const cat = searchParams.get("category");
    const sub = searchParams.get("subcategory");
    if (cat || sub) updateFilters({ category: cat || "", subcategory: sub || "" });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLoading(true);
    getWorkers(filters)
      .then(setWorkers)
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <>
      <div className="flex gap-6">
        {/* Filter sidebar */}
        <div className="w-64 flex-shrink-0 hidden lg:block">
          <FilterPanel className="w-full" />
        </div>

        {/* Worker grid */}
        <div className="flex-1 min-w-0">
          {/* Mobile filters */}
          <div className="lg:hidden mb-4">
            <FilterPanel />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <WorkerCardSkeleton key={i} />)}
            </div>
          ) : workers.length === 0 ? (
            <EmptyState
              icon="workers"
              titleHi="अभी कोई वर्कर नहीं मिला"
              titleEn="No workers found"
              descHi="अपनी request save करें — हम आपको जल्द call करेंगे!"
              descEn="Save your request — we will call you back soon!"
              action={{
                labelHi: "Request Save करें",
                labelEn: "Save My Request",
                onClick: () => setShowModal(true),
              }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {workers.map(w => <WorkerCard key={w.id} worker={w} />)}
            </div>
          )}
        </div>
      </div>

      {showModal && <SaveRequestModal onClose={() => setShowModal(false)} />}
    </>
  );
}

export default function WorkersPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-neutral-bg">
        {/* Page header */}
        <div className="bg-primary-blue px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <h1
              className="text-2xl md:text-3xl font-black text-white mb-1"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              वर्कर ढूंढें
            </h1>
            <p className="text-white/80">Browse & Hire Workers</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <Suspense fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <WorkerCardSkeleton key={i} />)}
            </div>
          }>
            <WorkerList />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
