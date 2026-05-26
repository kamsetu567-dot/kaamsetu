"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, User } from "lucide-react";
import Header from "@/components/Header";

const TABS = [
  { href: "/client/dashboard",         label: "Requests",  icon: LayoutDashboard, exact: true },
  { href: "/client/dashboard/profile", label: "Profile",   icon: User },
];

export default function ClientDashboardLayout({ children }) {
  const pathname = usePathname();

  function isActive(tab) {
    if (tab.exact) return pathname === tab.href;
    return pathname.startsWith(tab.href);
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      <Header />

      <div className="bg-brand-navy px-4 py-5">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-xl font-black text-white font-hindi">Client Dashboard</h1>
          <p className="text-white/50 text-sm">क्लाइंट डैशबोर्ड</p>
        </div>
      </div>

      <nav className="bg-white border-b border-gray-100 overflow-x-auto sticky top-0 z-30">
        <div className="flex max-w-5xl mx-auto px-2 min-w-max">
          {TABS.map(tab => {
            const active = isActive(tab);
            return (
              <Link key={tab.href} href={tab.href}
                className={`flex flex-col items-center gap-0.5 px-4 py-3 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 font-hindi ${
                  active ? "border-brand-navy text-brand-navy" : "border-transparent text-gray-400 hover:text-brand-navy"
                }`}>
                <tab.icon size={18} />
                <span className="text-xs font-semibold">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
