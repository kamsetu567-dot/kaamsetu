"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Wrench } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";

export default function Header() {
  const { isLoggedIn, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const roleHome = {
    worker: "/worker/dashboard",
    client: "/client/dashboard",
    shop: "/shop/dashboard",
    admin: "/admin",
  };

  return (
    <header className="sticky top-0 z-50 bg-primary-navy shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group" aria-label="KaamSetu Home">
          <div className="w-9 h-9 bg-accent-yellow rounded-lg flex items-center justify-center flex-shrink-0">
            <Wrench size={20} className="text-primary-navy" />
          </div>
          <span className="font-black text-2xl tracking-tight">
            <span className="text-white">KAAM</span>
            <span className="text-accent-yellow">SETU</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Link
                href={roleHome[user?.role] || "/"}
                className="text-white hover:text-accent-yellow font-medium px-3 py-2 rounded-lg transition-colors"
              >
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>डैशबोर्ड</span>
                <span className="text-xs block text-center opacity-70">Dashboard</span>
              </Link>
              <button
                onClick={logout}
                className="border-2 border-white/50 text-white hover:border-accent-yellow hover:text-accent-yellow font-semibold px-4 py-2 rounded-xl transition-colors min-h-10"
                aria-label="Logout"
              >
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>लॉगआउट</span>
                <span className="text-xs block text-center opacity-70">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="border-2 border-white/50 text-white hover:border-accent-yellow hover:text-accent-yellow font-semibold px-4 py-2 rounded-xl transition-colors text-center min-h-10 flex items-center justify-center"
                aria-label="Login"
              >
                <div>
                  <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>लॉगिन करें</span>
                  <span className="text-xs block opacity-70">Login</span>
                </div>
              </Link>
              <Link
                href="/auth/signup"
                className="bg-accent-yellow text-primary-navy font-bold px-4 py-2 rounded-xl hover:bg-yellow-300 transition-colors text-center min-h-10 flex items-center justify-center"
                aria-label="Sign Up"
              >
                <div>
                  <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>साइनअप करें</span>
                  <span className="text-xs block opacity-70">Sign Up</span>
                </div>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white p-2 rounded-lg"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-primary-navy border-t border-white/10 px-4 pb-4 space-y-2">
          <Link href="/categories" className="block text-white py-3 border-b border-white/10" onClick={() => setMenuOpen(false)}>
            <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>सभी सेवाएँ</span>
            <span className="text-xs text-white/60 ml-2">/ All Services</span>
          </Link>
          {isLoggedIn ? (
            <>
              <Link
                href={roleHome[user?.role] || "/"}
                className="block text-white py-3 border-b border-white/10"
                onClick={() => setMenuOpen(false)}
              >
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>डैशबोर्ड</span>
                <span className="text-xs text-white/60 ml-2">/ Dashboard</span>
              </Link>
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="w-full text-left text-white py-3"
                aria-label="Logout"
              >
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>लॉगआउट</span>
                <span className="text-xs text-white/60 ml-2">/ Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="block bg-white/10 text-white text-center py-3 rounded-xl font-semibold mt-3" onClick={() => setMenuOpen(false)}>
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>लॉगिन करें / Login</span>
              </Link>
              <Link href="/auth/signup" className="block bg-accent-yellow text-primary-navy text-center py-3 rounded-xl font-bold" onClick={() => setMenuOpen(false)}>
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>साइनअप करें / Sign Up</span>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
