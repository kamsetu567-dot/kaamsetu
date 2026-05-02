"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, UserCheck, Briefcase, CreditCard,
  Tag, Bell, BarChart3, Settings, Shield, Megaphone, Search, Wrench,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", hi: "डैशबोर्ड", en: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/workers", hi: "वर्कर", en: "Workers", icon: UserCheck },
  { href: "/admin/clients", hi: "क्लाइंट", en: "Clients", icon: Users },
  { href: "/admin/jobs", hi: "जॉब्स", en: "Jobs", icon: Briefcase },
  { href: "/admin/payments", hi: "भुगतान", en: "Payments", icon: CreditCard },
  { href: "/admin/offers", hi: "ऑफर", en: "Offers", icon: Tag },
  { href: "/admin/notifications", hi: "सूचनाएँ", en: "Notifications", icon: Bell },
  { href: "/admin/search-management", hi: "सर्च प्रबंधन", en: "Search Mgmt", icon: Search },
  { href: "/admin/analytics", hi: "विश्लेषण", en: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", hi: "सेटिंग्स", en: "Settings", icon: Settings },
  { href: "/admin/security", hi: "सुरक्षा", en: "Security", icon: Shield },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  function isActive(item) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-primary-navy min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent-yellow rounded-lg flex items-center justify-center">
            <Wrench size={16} className="text-primary-navy" />
          </div>
          <div>
            <span className="font-black text-white text-lg">KAAMSETU</span>
            <p className="text-white/50 text-xs">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(item => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                active
                  ? "bg-accent-yellow text-primary-navy font-bold"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
              aria-label={item.en}
              aria-current={active ? "page" : undefined}
            >
              <item.icon size={18} className="flex-shrink-0" />
              <div>
                <span
                  className="block text-sm font-semibold"
                  style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                >
                  {item.hi}
                </span>
                <span className="block text-xs opacity-70">{item.en}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <Link href="/" className="text-white/50 hover:text-white text-xs flex items-center gap-2 transition-colors">
          <Megaphone size={14} />
          <span>Back to Site / साइट पर जाएं</span>
        </Link>
      </div>
    </aside>
  );
}
