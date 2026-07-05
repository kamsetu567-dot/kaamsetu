"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, UserCheck, Briefcase, CreditCard,
  Tag, Bell, BarChart3, Settings, Shield, Megaphone, Search, LogOut, Store,
  AlertTriangle, FolderOpen,
} from "lucide-react";
import { adminLogout } from "@/lib/utils/adminAuth";

const NAV_ITEMS = [
  { href: "/admin", hi: "डैशबोर्ड", en: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/workers", hi: "वर्कर", en: "Workers", icon: UserCheck },
  { href: "/admin/clients", hi: "क्लाइंट", en: "Clients", icon: Users },
  { href: "/admin/shops", hi: "शॉप्स", en: "Shops", icon: Store },
  { href: "/admin/ads",   hi: "विज्ञापन", en: "Ads Review", icon: Megaphone },
  { href: "/admin/jobs", hi: "जॉब्स", en: "Jobs", icon: Briefcase },
  { href: "/admin/pending-requests", hi: "Requests", en: "Pending Requests", icon: Briefcase },
  { href: "/admin/notifications", hi: "सूचनाएँ", en: "Notifications", icon: Bell },
  { href: "/admin/payments", hi: "भुगतान", en: "Payments", icon: CreditCard },
  { href: "/admin/reports", hi: "रिपोर्ट्स", en: "Reports", icon: AlertTriangle },
  { href: "/admin/categories", hi: "कैटेगरी", en: "Categories", icon: FolderOpen },
  { href: "/admin/offers", hi: "ऑफर", en: "Offers", icon: Tag },
  { href: "/admin/search-management", hi: "सर्च", en: "Search Management", icon: Search },
  { href: "/admin/security", hi: "सुरक्षा", en: "Security", icon: Shield },
  { href: "/admin/analytics", hi: "विश्लेषण", en: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", hi: "सेटिंग्स", en: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  function isActive(item) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-brand-navy min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="KaamSetu"
            width={56}
            height={56}
            className="w-14 h-14 rounded-xl object-contain flex-shrink-0"
            unoptimized
          />
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
                  ? "bg-brand-yellow text-brand-navy font-bold"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
              aria-label={item.en}
              aria-current={active ? "page" : undefined}
            >
              <item.icon size={18} className="flex-shrink-0" />
              <div>
                <span className="block text-sm font-semibold font-hindi">
                  {item.hi}
                </span>
                <span className="block text-xs opacity-70">{item.en}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <Link href="/" className="text-white/50 hover:text-white text-xs flex items-center gap-2 transition-colors">
          <Megaphone size={14} />
          <span>Back to Site / साइट पर जाएं</span>
        </Link>
        <button
          onClick={adminLogout}
          className="w-full flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 px-2 py-2 rounded-xl transition-colors text-xs"
        >
          <LogOut size={14} />
          <span>Logout / लॉगआउट</span>
        </button>
      </div>
    </aside>
  );
}
