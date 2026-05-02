"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Briefcase, User, CreditCard,
  Bell, Users, ArrowLeft,
} from "lucide-react";
import Header from "@/components/Header";
import WorkerStatusBadge from "@/components/WorkerStatusBadge";
import { useWorkerStatus } from "@/lib/context/WorkerStatusContext";

const TABS = [
  { href: "/worker/dashboard",             hi: "Overview",     en: "Overview",      icon: LayoutDashboard, exact: true },
  { href: "/worker/dashboard/jobs",        hi: "जॉब्स",        en: "Jobs",          icon: Briefcase },
  { href: "/worker/dashboard/profile",     hi: "प्रोफ़ाइल",   en: "Profile",       icon: User },
  { href: "/worker/dashboard/subscription",hi: "सब्सक्रिप्शन", en: "Subscription",  icon: CreditCard },
  { href: "/worker/dashboard/notifications",hi: "सूचनाएँ",     en: "Alerts",        icon: Bell },
  { href: "/worker/dashboard/referrals",   hi: "रेफरल",        en: "Referrals",     icon: Users },
];

export default function WorkerDashboardLayout({ children }) {
  const pathname = usePathname();
  const { status } = useWorkerStatus();

  function isActive(tab) {
    if (tab.exact) return pathname === tab.href;
    return pathname.startsWith(tab.href);
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-bg">
      <Header />

      {/* Dashboard banner */}
      <div className="bg-primary-blue px-4 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div>
            <h1
              className="text-xl font-black text-white"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              Worker Dashboard
            </h1>
            <p className="text-white/70 text-sm">वर्कर डैशबोर्ड</p>
          </div>
          <WorkerStatusBadge status={status} size="md" />
        </div>
      </div>

      {/* Horizontal scrollable tab bar */}
      <nav
        className="bg-white border-b-2 border-border-light overflow-x-auto sticky top-16 z-30"
        aria-label="Worker dashboard navigation"
      >
        <div className="flex max-w-5xl mx-auto px-2 min-w-max">
          {TABS.map(tab => {
            const active = isActive(tab);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 px-4 py-3 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                  active
                    ? "border-primary-blue text-primary-blue"
                    : "border-transparent text-text-secondary hover:text-primary-blue hover:border-blue-200"
                }`}
                aria-label={tab.en}
                aria-current={active ? "page" : undefined}
              >
                <tab.icon size={18} />
                <span
                  className="text-xs font-semibold"
                  style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                >
                  {tab.hi}
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
