'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Menu, X, ChevronDown, LogOut, User, LayoutDashboard,
  Briefcase, Settings, Store, Globe, Flag, Bell, ExternalLink,
} from 'lucide-react';
import { useLang } from '@/lib/context/LanguageContext';
import { useToast } from '@/components/Toast';

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
  const toast = useToast();
  const { lang, toggleLang } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const dropdownRef = useRef(null);

  // Bell dropdown
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileNotifOpen, setMobileNotifOpen] = useState(false);
  const bellRef = useRef(null);

  // Report modal
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('kaamsetu_token');
    const userData = localStorage.getItem('kaamsetu_user');
    if (token && userData) {
      try { setUser(JSON.parse(userData)); } catch {}
    }
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = useCallback(async () => {
    const token = localStorage.getItem('kaamsetu_token');
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (d?.success) {
        setNotifications(d.notifications || []);
        setUnreadCount(d.unreadCount || 0);
      }
    } catch {}
  }, []);

  // Poll so a fresh admin broadcast shows up without a page reload. 60s (not the
  // 10s the job feed uses) because broadcasts are rare and this Header mounts on
  // every page. Paused while the tab is hidden; refetched the moment it's shown
  // again, so returning to the tab surfaces the dot immediately.
  useEffect(() => {
    if (!user) return;
    loadNotifications();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') loadNotifications();
    }, 60_000);
    const onVisible = () => { if (document.visibilityState === 'visible') loadNotifications(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user, loadNotifications]);

  // Marks everything read. The count is zeroed optimistically and deliberately
  // NOT rolled back on failure — the server is the source of truth and the next
  // poll restores the badge, whereas a rollback would flicker it back instantly
  // and look broken.
  const markAllRead = useCallback(() => {
    setUnreadCount(prev => {
      if (prev === 0) return 0;
      const token = localStorage.getItem('kaamsetu_token');
      if (token) {
        fetch('/api/notifications/read', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
      return 0;
    });
    setNotifications(ns => ns.map(n => (n.unread ? { ...n, unread: false } : n)));
  }, []);

  function toggleBell() {
    const opening = !bellOpen;
    setBellOpen(opening);
    if (opening) markAllRead();
  }

  // The mobile panel needs its own open-state: the click-outside handler below
  // closes `bellOpen` on any mousedown outside the (desktop) bell, which would
  // slam the mobile panel shut the instant you tapped it.
  function toggleMobileNotif() {
    const opening = !mobileNotifOpen;
    setMobileNotifOpen(opening);
    if (opening) markAllRead();
  }

  function openReport() {
    setMenuOpen(false);
    if (!user) {
      // Bounce guests to login, then back to home (modal isn't pinned to a page).
      router.push('/auth/login');
      return;
    }
    setReportTitle('');
    setReportDesc('');
    setReportOpen(true);
  }

  async function submitReport(e) {
    e.preventDefault();
    if (reportSubmitting) return;
    if (!reportTitle.trim()) { toast.error(t({ hi: 'विषय डालें', en: 'Add a subject' })); return; }
    if (reportDesc.trim().length < 5) { toast.error(t({ hi: 'समस्या के बारे में लिखें', en: 'Describe the issue' })); return; }
    setReportSubmitting(true);
    try {
      const token = localStorage.getItem('kaamsetu_token');
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: reportTitle.trim(), description: reportDesc.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data?.message || t({ hi: 'सबमिट नहीं हो पाया', en: 'Could not submit' })); return; }
      toast.success(t({ hi: 'रिपोर्ट भेजी गई', en: 'Report submitted' }));
      setReportOpen(false);
    } catch {
      toast.error(t({ hi: 'नेटवर्क error', en: 'Network error' }));
    } finally {
      setReportSubmitting(false);
    }
  }

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
        <div className="relative flex items-center justify-between h-14 sm:h-16 lg:h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center min-h-0 flex-shrink-0">
            <Image
              src="/logo.png"
              alt="KaamSetu"
              width={260}
              height={96}
              className="h-14 sm:h-16 lg:h-16 w-auto object-contain"
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
                {/* Report button */}
                <button onClick={openReport}
                  className="flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-lg w-9 h-9 transition-colors min-h-0"
                  aria-label={t({ hi: 'रिपोर्ट करें', en: 'Report' })}>
                  <Flag size={16} className="text-white/80" />
                </button>

                {/* Notification bell */}
                <div className="relative" ref={bellRef}>
                  <button onClick={toggleBell}
                    className="relative flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-lg w-9 h-9 transition-colors min-h-0"
                    aria-label={unreadCount > 0
                      ? t({ hi: `सूचनाएँ — ${unreadCount} नई`, en: `Notifications — ${unreadCount} new` })
                      : t({ hi: 'सूचनाएँ', en: 'Notifications' })}>
                    <Bell size={16} className="text-white/80" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black rounded-full min-w-[16px] h-[16px] px-1 flex items-center justify-center ring-2 ring-brand-navy">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {bellOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 max-h-96 overflow-y-auto">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="font-black text-brand-navy text-sm font-hindi">{t({ hi: 'सूचनाएँ', en: 'Notifications' })}</p>
                      </div>
                      {notifications.length === 0 ? (
                        <p className="px-4 py-6 text-center text-gray-400 text-sm font-hindi">
                          {t({ hi: 'अभी कोई सूचना नहीं', en: 'No notifications yet' })}
                        </p>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className={`px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 border-gray-50 ${n.unread ? 'bg-red-50/60' : ''}`}>
                            <p className="font-bold text-brand-navy text-sm flex items-center gap-1.5">
                              {n.unread && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
                              {n.title}
                            </p>
                            {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
                            {n.href && (
                              <Link href={n.href} onClick={() => setBellOpen(false)}
                                className="inline-flex items-center gap-1 text-brand-navy text-xs font-semibold mt-1 hover:underline">
                                {t({ hi: 'देखें', en: 'View' })} <ExternalLink size={11} />
                              </Link>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

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
              className="relative text-white p-2 min-h-0"
              aria-label={unreadCount > 0 ? `Open menu — ${unreadCount} new notifications` : 'Open menu'}>
              <Menu size={24} />
              {/* The bell lives in the desktop bar only, so without this the
                  unread signal would be invisible to mobile users — i.e. to
                  almost every worker on this site. */}
              {user && unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-brand-navy" />
              )}
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

                {/* Notifications — the desktop bell isn't rendered on mobile, so
                    this is the only way phone users reach their announcements. */}
                <button onClick={toggleMobileNotif}
                  className="flex items-center gap-3 w-full py-3 px-4 text-white/90 hover:bg-white/5 rounded-xl min-h-0 font-hindi">
                  <Bell size={18} />
                  <span className="flex-1 text-left">{t({ hi: 'सूचनाएँ', en: 'Notifications' })}</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                  <ChevronDown size={16} className={`text-white/50 transition-transform ${mobileNotifOpen ? 'rotate-180' : ''}`} />
                </button>
                {mobileNotifOpen && (
                  <div className="mx-2 mb-2 bg-white/5 rounded-xl divide-y divide-white/10 max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-4 text-center text-white/50 text-sm font-hindi">
                        {t({ hi: 'अभी कोई सूचना नहीं', en: 'No notifications yet' })}
                      </p>
                    ) : notifications.map(n => (
                      <div key={n.id} className="px-4 py-3">
                        <p className="font-bold text-white text-sm flex items-center gap-1.5">
                          {n.unread && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
                          {n.title}
                        </p>
                        {n.body && <p className="text-xs text-white/60 mt-0.5">{n.body}</p>}
                        {n.href && (
                          <Link href={n.href} onClick={() => setMenuOpen(false)}
                            className="inline-flex items-center gap-1 text-brand-yellow text-xs font-semibold mt-1">
                            {t({ hi: 'देखें', en: 'View' })} <ExternalLink size={11} />
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}

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
          {/* Mobile-only Report shortcut */}
          {user && (
            <div className="p-4 border-t border-white/10">
              <button onClick={openReport}
                className="flex items-center gap-2 w-full justify-center text-white bg-red-500/80 hover:bg-red-500 rounded-xl py-3 font-bold font-hindi min-h-0">
                <Flag size={16} /> {t({ hi: 'रिपोर्ट करें', en: 'Report a Problem' })}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Report modal — opens from the navbar Flag button. */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-brand-navy text-lg flex items-center gap-2 font-hindi">
                <Flag size={18} className="text-red-500" />
                {t({ hi: 'समस्या रिपोर्ट करें', en: 'Report a Problem' })}
              </h3>
              <button onClick={() => setReportOpen(false)} className="text-gray-400 hover:text-gray-600 min-h-0">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submitReport} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 font-hindi">
                  {t({ hi: 'विषय', en: 'Subject' })}
                </label>
                <input type="text" value={reportTitle} onChange={e => setReportTitle(e.target.value)}
                  placeholder={t({ hi: 'जैसे: Payment नहीं हो रहा', en: 'e.g. Payment not working' })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-sm"
                  maxLength={200}
                  autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 font-hindi">
                  {t({ hi: 'विस्तार से बताएँ', en: 'Describe the issue' })}
                </label>
                <textarea value={reportDesc} onChange={e => setReportDesc(e.target.value)}
                  placeholder={t({ hi: 'क्या हुआ, कब हुआ...', en: 'What happened, when did it happen...' })}
                  rows={5}
                  maxLength={2000}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-sm resize-none" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setReportOpen(false)}
                  className="flex-1 border-2 border-gray-200 text-gray-500 font-bold py-2.5 rounded-xl min-h-0">
                  {t({ hi: 'रद्द', en: 'Cancel' })}
                </button>
                <button type="submit" disabled={reportSubmitting}
                  className="flex-1 bg-brand-navy text-white font-bold py-2.5 rounded-xl disabled:opacity-50 min-h-0">
                  {reportSubmitting ? t({ hi: 'भेज रहे हैं...', en: 'Submitting...' }) : t({ hi: 'सबमिट करें', en: 'Submit' })}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
