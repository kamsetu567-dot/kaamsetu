"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Rocket, ChevronLeft, Bell } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useT } from "@/lib/i18n/useT";

// Per-feature copy. `feature` comes from the ?feature= query param set by the
// homepage tile. Falls back to a generic message so any future coming-soon
// link works without adding a case here.
const FEATURES = {
  partner: {
    title: { hi: "टीम / पार्टनर प्रोग्राम", en: "Team / Partner Program" },
    desc: {
      hi: "टीम लीडर बनने और पार्टनर के तौर पर जुड़ने का फ़ीचर अभी तैयार किया जा रहा है। जल्द ही लॉन्च होगा!",
      en: "Becoming a team leader and joining as a partner is being built. It will launch soon!",
    },
  },
};

const DEFAULT = {
  title: { hi: "जल्द आ रहा है", en: "Coming Soon" },
  desc: {
    hi: "यह फ़ीचर अभी तैयार किया जा रहा है। जल्द ही उपलब्ध होगा!",
    en: "This feature is being built and will be available soon!",
  },
};

function ComingSoonContent() {
  const t = useT();
  const params = useSearchParams();
  const feature = params.get("feature") || "";
  const cfg = FEATURES[feature] || DEFAULT;

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16 bg-brand-bg">
      <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Rocket size={30} className="text-purple-600" />
        </div>

        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-yellow/30 text-brand-navy mb-4">
          <Bell size={12} /> {t({ hi: "जल्द आ रहा है", en: "Coming Soon" })}
        </span>

        <h1
          className="text-2xl font-black text-brand-navy mb-2"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          {t(cfg.title)}
        </h1>

        <p
          className="text-gray-500 text-sm leading-relaxed mb-6"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          {t(cfg.desc)}
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-brand-navy text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-900 transition-colors"
        >
          <ChevronLeft size={18} />
          {t({ hi: "होम पर वापस जाएँ", en: "Back to Home" })}
        </Link>
      </div>
    </div>
  );
}

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Suspense fallback={<div className="flex-1" />}>
        <ComingSoonContent />
      </Suspense>
      <Footer />
    </div>
  );
}
