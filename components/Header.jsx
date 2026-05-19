'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Menu, X, ChevronDown, LogOut, User, LayoutDashboard,
  Briefcase, Settings, Store, Globe, Bell,
} from 'lucide-react';
import { useLang } from '@/lib/context/LanguageContext';

// ── translations ────────────────────────────────────────────────────
const T = {
  login:    { hi: 'लॉगिन',       en: 'Login' },
  signup:   { hi: 'साइन अप करें', en: 'Sign Up' },
  logout:   { hi: 'लॉगआउट',      en: 'Logout' },
  switchTo: { hi: 'Switch to English', en: 'हिंदी में बदलें' },
};

// ── nav link sets per role ───────────────────────────────────────────
const NAV_GUEST = [
  { href: '/',           hi: 'होम',           en: 'Home' },
  { href: '/workers',    hi: 'सेवाएँ',         en: 'Services' },
  { href: '/categories', hi: 'कैटेगरी',        en: 'Categories' },
  { href: '/about',      hi: 'हमारे बारे में',  en: 'About' },
];

const NAV_WORKER = [
  { href: '/worker/dashboard',              hi: 'डैशबोर्ड',  en: 'Dashboard' },
  { href: '/worker/dashboard/jobs',         hi: 'मेरी Jobs',  en: 'My Jobs' },
  { href: '/worker/dashboard/profile',      hi: 'प्रोफाइल',   en: 'Profile' },
  { href: '/worker/dashboard/subscription', hi: 'सब्सक्रिप्शन', en: 'Subscription' },
  { href: '/worker/dashboard/referrals',    hi: 'Referral',   en: 'Referral' },
];

const NAV_CLIENT = [
  { href: '/client/dashboard',      hi: 'डैशबोर्ड',      en: 'Dashboard' },
  { href: '/client/request-service', hi: 'काम करवाओ',     en: 'Request Service' },
  { href: '/workers',                hi: 'Workers ढूंढें', en: 'Find Workers' },
];

const NAV_SHOP = [
  { href: '/shop/dashboard', hi: 'डैशबोर्ड', en: 'Dashboard' },
  { href: '/shop/ads',       hi: 'My Ads',   en: 'My Ads' },
];

// ── dropdown items per role ──────────────────────────────────────────
const DROPDOWN_WORKER = [
  { href: '/worker/dashboard/profile',      hi: 'प्रोफाइल',     en: 'Profile',      icon: User },
  { href: '/worker/dashboard/subscription', hi: 'सब्सक्रिप्शन', en: 'Subscription', icon: Briefcase },
];
const DROPDOWN_CLIENT = [
  { href: '/client/dashboard', hi: 'मेरी Requests', en: 'My Requests', icon: LayoutDashboard },
];
const DROPDOWN_SHOP = [
  { href: '/shop/ads',       hi: 'मेरे ऐड्स',   en: 'My Ads',      icon: Store },
  { href: '/shop/dashboard', hi: 'डैशबोर्ड',    en: 'Dashboard',   icon: LayoutDashboard },
];
const DROPDOWN_ADMIN = [
  { href: '/admin', hi: 'Admin Panel', en: 'Admin Panel', icon: Settings },
];

export default function Header() {
  const router = useRouter();
  const { lang, toggleLang } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('kaamsetu_token');
    const userData = localStorage.getItem('kaamsetu_user');
    if (token && userData) {
      try { setUser(JSON.parse(userData)); } catch {}
    }
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    localStorage.removeItem('kaamsetu_token');
    localStorage.removeItem('kaamsetu_user');
    setUser(null);
    setDropdownOpen(false);
    router.push('/');
  }

  function getInitials(name) {
    if (!name) return 'U';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  const t = (obj) => obj?.[lang] ?? obj?.hi ?? '';

  const role = user?.role;
  const navLinks = role === 'worker' ? NAV_WORKER
    : role === 'client' ? NAV_CLIENT
    : role === 'shop'   ? NAV_SHOP
    : NAV_GUEST;

  const dropdownLinks = role === 'worker' ? DROPDOWN_WORKER
    : role === 'client' ? DROPDOWN_CLIENT
    : role === 'shop'   ? DROPDOWN_SHOP
    : role === 'admin'  ? DROPDOWN_ADMIN : [];

  return (
    <header className="sticky top-0 z-50 bg-brand-navy shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative flex items-center justify-between h-20 sm:h-24 lg:h-24">

          {/* Logo */}
          <Link href="/" className="flex items-center min-h-0 flex-shrink-0">
            <Image
              src="/logo.png"
              alt="KaamSetu"
              width={260}
              height={96}
              className="h-20 sm:h-24 lg:h-24 w-auto object-contain"
              priority
              unoptimized
            />
          </Link>

          {/* Desktop nav — absolutely centered */}
          <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-6 h-full">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href}
                className="flex items-center h-full text-white/80 hover:text-brand-yellow text-sm font-medium transition-colors font-hindi">
                {t(l)}
              </Link>
            ))}
          </nav>

          {/* Right side — lang toggle + auth */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">

            {/* Language toggle */}
            <button onClick={toggleLang}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors min-h-0">
              <Globe size={13} className="text-white/70" />
              <span>{lang === 'hi' ? 'EN' : 'हिं'}</span>
            </button>

            {user ? (
              <>
                {/* Notifications bell */}
                <button className="relative p-2 text-white/70 hover:text-brand-yellow transition-colors min-h-0">
                  <Bell size={18} />
                </button>

                {/* Profile dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 transition-colors min-h-0">
                    <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center text-brand-navy font-bold text-sm flex-shrink-0">
                      {getInitials(user.name)}
                    </div>
                    <span className="text-white text-sm font-medium max-w-24 truncate">{user.name || 'User'}</span>
                    <ChevronDown size={14} className="text-white/70" />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                      {dropdownLinks.map(l => (
                        <Link key={l.href} href={l.href} onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 text-sm min-h-0 font-hindi">
                          <l.icon size={15} className="text-brand-navy" />
                          {t(l)}
                        </Link>
                      ))}
                      <hr className="my-1 border-gray-100" />
                      <button onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-red-600 hover:bg-red-50 text-sm min-h-0 font-hindi">
                        <LogOut size={15} />
                        {t(T.logout)}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login"
                  className="border border-white/40 text-white hover:border-white rounded-xl px-4 py-2 text-sm font-medium transition-colors min-h-0 font-hindi">
                  {t(T.login)}
                </Link>
                <Link href="/auth/select-role"
                  className="bg-brand-yellow text-brand-navy font-bold rounded-xl px-4 py-2 text-sm hover:bg-amber-400 transition-colors min-h-0 font-hindi">
                  {t(T.signup)}
                </Link>
              </>
            )}
          </div>

          {/* Mobile right side — lang + hamburger */}
          <div className="lg:hidden flex items-center gap-1">
            <button onClick={toggleLang}
              className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors">
              <Globe size={13} className="text-white/70" />
              <span>{lang === 'hi' ? 'EN' : 'हिं'}</span>
            </button>
            <button onClick={() => setMenuOpen(true)}
              className="text-white p-2 min-h-0" aria-label="Open menu">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-brand-navy flex flex-col">
          <div className="flex items-center justify-between px-4 h-20 border-b border-white/10">
            <Image src="/logo.png" alt="KaamSetu" width={180} height={72} className="h-20 w-auto object-contain" unoptimized />
            <button onClick={() => setMenuOpen(false)} className="text-white p-2 min-h-0" aria-label="Close menu">
              <X size={24} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                className="block py-3 px-4 text-white/90 hover:text-brand-yellow hover:bg-white/5 rounded-xl font-hindi text-lg min-h-0">
                {t(l)}
              </Link>
            ))}
            {/* Lang toggle in mobile */}
            <button onClick={toggleLang}
              className="flex items-center gap-3 w-full py-3 px-4 text-white/90 hover:bg-white/5 rounded-xl min-h-0">
              <Globe size={18} className="text-brand-yellow" />
              <span className="text-brand-yellow font-bold text-base">{lang === 'hi' ? 'EN' : 'हिं'}</span>
              <span className="text-white/60 text-sm font-hindi">{t(T.switchTo)}</span>
            </button>
            {user && (
              <>
                <hr className="border-white/10 my-4" />
                {dropdownLinks.map(l => (
                  <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 py-3 px-4 text-white/90 hover:bg-white/5 rounded-xl min-h-0 font-hindi">
                    <l.icon size={18} />
                    <span>{t(l)}</span>
                  </Link>
                ))}
                <button onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="flex items-center gap-3 w-full py-3 px-4 text-red-400 hover:bg-white/5 rounded-xl min-h-0 font-hindi">
                  <LogOut size={18} />
                  {t(T.logout)}
                </button>
              </>
            )}
          </nav>
          {!user && (
            <div className="p-4 space-y-3 border-t border-white/10">
              <Link href="/auth/login" onClick={() => setMenuOpen(false)}
                className="block w-full text-center border border-white/40 text-white rounded-xl py-3 font-medium min-h-0 font-hindi">
                {t(T.login)}
              </Link>
              <Link href="/auth/select-role" onClick={() => setMenuOpen(false)}
                className="block w-full text-center bg-brand-yellow text-brand-navy font-bold rounded-xl py-3 font-hindi min-h-0">
                {t(T.signup)}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
