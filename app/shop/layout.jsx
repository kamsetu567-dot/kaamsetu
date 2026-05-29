"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Megaphone, Wrench } from "lucide-react";
import Header from "@/components/Header";
import { useLang } from "@/lib/context/LanguageContext";

const TABS = [
  { href: "/shop/dashboard", hi: "डैशबोर्ड", en: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/shop/ads",       hi: "विज्ञापन",  en: "Manage Ads", icon: Megaphone },
];

export default function ShopLayout({ children }) {
  const pathname = usePathname();
  const { lang } = useLang();
  const isHi = lang === "hi";

  function isActive(tab) {
    if (tab.exact) return pathname === tab.href;
    return pathname.startsWith(tab.href);
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      <Header />

      {/* Shop dashboard banner — navy matches the "दुकान / सामान" action card */}
      <div className="bg-brand-navy px-4 py-5">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-yellow rounded-xl flex items-center justify-center flex-shrink-0">
            <Wrench size={20} className="text-brand-navy" />
          </div>
          <div>
            <h1
              className="text-xl font-black text-white"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              {isHi ? "दुकान डैशबोर्ड" : "Shop Dashboard"}
            </h1>
            <p className="text-white/70 text-sm">{isHi ? "Shop Dashboard" : "दुकान डैशबोर्ड"}</p>
          </div>
        </div>
      </div>

      {/* Horizontal scrollable tab bar — same pattern as worker dashboard */}
      <nav
        className="bg-white border-b-2 border-gray-200 overflow-x-auto sticky top-16 z-30"
        aria-label="Shop dashboard navigation"
      >
        <div className="flex max-w-5xl mx-auto px-2 min-w-max">
          {TABS.map(tab => {
            const active = isActive(tab);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 px-5 py-3 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                  active
                    ? "border-brand-navy text-brand-navy"
                    : "border-transparent text-gray-500 hover:text-brand-navy hover:border-blue-200"
                }`}
                aria-label={tab.en}
                aria-current={active ? "page" : undefined}
              >
                <tab.icon size={18} />
                <span
                  className="text-xs font-semibold"
                  style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                >
                  {isHi ? tab.hi : tab.en}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
