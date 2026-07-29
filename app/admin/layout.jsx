"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import AdminSidebar from "@/components/AdminSidebar";
import { Menu } from "lucide-react";
import { isAdminLoggedIn } from "@/lib/utils/adminAuth";
import { useT } from "@/lib/i18n/useT";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const t = useT();

  useEffect(() => {
    if (pathname === "/admin/login") {
      setAuthChecked(true);
      return;
    }
    if (!isAdminLoggedIn()) {
      router.replace("/admin/login");
      // Leave authChecked false — children stay hidden while redirecting
    } else {
      setAuthChecked(true);
    }
  }, [pathname]);

  if (pathname === "/admin/login") {
    return children;
  }

  // Block children from mounting until auth is confirmed.
  // Without this, children fire API calls immediately, get 401,
  // and apiFetch redirects to /auth/login instead of /admin/login.
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="w-8 h-8 border-4 border-brand-navy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-brand-bg">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:static lg:block transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <AdminSidebar />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden bg-brand-navy px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white p-1"
            aria-label="Open sidebar"
          >
            <Menu size={22} />
          </button>
          <Image
            src="/logo.png"
            alt="Karvia"
            width={44}
            height={44}
            className="w-11 h-11 rounded-lg object-contain flex-shrink-0"
            unoptimized
          />
          <span className="text-white font-black text-lg">KARVIA {t({ hi: 'एडमिन', en: 'Admin' })}</span>
        </div>

        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
