"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WorkerCard from "@/components/WorkerCard";
import FilterPanel from "@/components/FilterPanel";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton, { WorkerCardSkeleton } from "@/components/LoadingSkeleton";
import { useFilters } from "@/lib/context/FilterContext";
import { getWorkers } from "@/lib/api/workers";
import { apiGet } from "@/lib/api/client";

function SaveRequestModal({ onClose }) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [saved, setSaved] = useState(false);

  if (saved) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-xl font-black text-brand-navy mb-2" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            Request Save हो गई!
          </p>
          <p className="text-gray-500 text-sm mb-5">हम जल्द call करेंगे / We will call you soon.</p>
          <button onClick={onClose} className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl">
            <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>ठीक है / OK</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
        <h3 className="font-black text-xl mb-1 text-brand-navy" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
          Request Save करें
        </h3>
        <p className="text-gray-500 text-sm mb-5">
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
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 text-base"
          />
          <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-500">
            <span className="px-4 py-4 bg-gray-50 border-r-2 border-gray-200 text-gray-500 font-semibold">+91</span>
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
              className="flex-1 border-2 border-gray-200 text-gray-500 font-bold py-3 rounded-xl hover:border-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => name && mobile.length === 10 && setSaved(true)}
              disabled={!name || mobile.length !== 10}
              className="flex-1 bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
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
  const router = useRouter();
  const { filters, updateFilters } = useFilters();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [role, setRole] = useState(null);
  const [clientCoords, setClientCoords] = useState(null); // { lat, lng } | null
  const [clientCity, setClientCity] = useState(""); // saved city for fallback when no GPS
  const [coordsResolved, setCoordsResolved] = useState(false); // true once we know whether client has GPS

  // Sync filters FROM the URL params (e.g. from /categories/[slug] tiles).
  // Must re-run whenever the query string changes — /workers is a client page,
  // so navigating from one category tile to another reuses this mounted
  // component and only swaps searchParams. With empty deps this ran only on
  // first mount, leaving the previous category's filter in place → the page
  // showed the previous tile's workers. Keying on the actual param values
  // re-syncs on every navigation. The FilterContext persists across pages, so
  // we also explicitly clear category/subcategory when the URL omits them.
  const urlCategory = searchParams.get("category") || "";
  const urlSubcategory = searchParams.get("subcategory") || "";
  useEffect(() => {
    updateFilters({ category: urlCategory, subcategory: urlSubcategory });
  }, [urlCategory, urlSubcategory, updateFilters]);

  // Read role from localStorage + fetch client coordinates (for distance filter)
  useEffect(() => {
    // Guests can't browse the hire page — push them to choose a role / sign up
    if (!localStorage.getItem("kaamsetu_token")) {
      router.replace("/auth/select-role");
      return;
    }

    let userRole = null;
    try {
      const user = JSON.parse(localStorage.getItem("kaamsetu_user") || "{}");
      userRole = user.role || null;
    } catch {}

    // Workers have no business browsing the hire page — send them home
    if (userRole === "worker") {
      router.replace("/worker/dashboard");
      return;
    }
    setRole(userRole);

    // Only clients need their saved GPS — workers don't use distance filter
    if (userRole === "client") {
      apiGet("/api/client/me")
        .then(data => {
          const coords = data?.client?.location?.coordinates?.coordinates;
          if (Array.isArray(coords) && coords.length === 2) {
            // GeoJSON stores [lng, lat]
            setClientCoords({ lng: coords[0], lat: coords[1] });
          }
          // City is used as a fallback when GPS is missing — distance chip
          // then means "approved workers in my city" instead of nothing.
          if (data?.client?.location?.city) setClientCity(data.client.location.city);
        })
        .catch(() => {})
        .finally(() => setCoordsResolved(true));
    } else {
      setCoordsResolved(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLoading(true);
    const augmented = {
      ...filters,
      // Prefer the client's saved city over any user-typed filter city, so the
      // server's city fallback always has something to anchor on when GPS is missing.
      city: filters.city || clientCity || "",
      ...(clientCoords ? { lat: clientCoords.lat, lng: clientCoords.lng } : {}),
    };
    getWorkers(augmented)
      .then(setWorkers)
      .finally(() => setLoading(false));
  }, [filters, clientCoords, clientCity]);

  // Banner: distance filter is active but neither GPS nor city is available
  // to anchor it — workers list will not be distance-filtered at all.
  const distanceFilterIgnored =
    coordsResolved && role === "client" && !clientCoords && !clientCity && filters.distance > 0;
  // Softer banner: GPS missing but city fallback active — accuracy nudge.
  const usingCityFallback =
    coordsResolved && role === "client" && !clientCoords && clientCity && filters.distance > 0;

  return (
    <>
      {distanceFilterIgnored && (
        <div className="mb-4 flex items-start gap-3 bg-yellow-50 border-2 border-yellow-200 rounded-2xl px-4 py-3">
          <MapPin size={18} className="text-yellow-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-yellow-900 font-semibold">
              Distance filter needs your location
            </p>
            <p className="text-xs text-yellow-800 mt-0.5">
              Showing all workers. Add your address to filter by distance.
            </p>
          </div>
          <Link
            href="/client/dashboard/profile"
            className="bg-yellow-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-yellow-700 whitespace-nowrap"
          >
            Update Profile
          </Link>
        </div>
      )}
      {usingCityFallback && (
        <div className="mb-4 flex items-start gap-3 bg-blue-50 border-2 border-blue-200 rounded-2xl px-4 py-3">
          <MapPin size={18} className="text-blue-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-blue-900 font-semibold">
              Showing workers in {clientCity}
            </p>
            <p className="text-xs text-blue-800 mt-0.5">
              Tap "Use My Location" on your profile for accurate km-based distance.
            </p>
          </div>
          <Link
            href="/client/dashboard/profile"
            className="bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-blue-700 whitespace-nowrap"
          >
            Enable GPS
          </Link>
        </div>
      )}

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
      <main className="flex-1 bg-brand-bg">
        {/* Page header */}
        <div className="bg-blue-600 px-4 py-6">
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
