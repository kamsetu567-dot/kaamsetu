'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Wrench, Menu, X, ChevronDown, LogOut, User, LayoutDashboard, Briefcase, Settings, PlusCircle, Store } from 'lucide-react';

export default function Header() {
  const router = useRouter();
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

  const workerLinks = [
    { href: '/worker/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/worker/dashboard/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/worker/dashboard/profile', label: 'Profile', icon: User },
  ];
  const clientLinks = [
    { href: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/client/request-service', label: 'New Request', icon: PlusCircle },
  ];
  const shopLinks = [
    { href: '/shop/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/shop/ads', label: 'My Ads', icon: Store },
  ];
  const adminLinks = [
    { href: '/admin', label: 'Admin Panel', icon: Settings },
  ];

  const roleLinks = user?.role === 'worker' ? workerLinks
    : user?.role === 'client' ? clientLinks
    : user?.role === 'shop' ? shopLinks
    : user?.role === 'admin' ? adminLinks : [];

  const navLinks = [
    { href: '/', label: 'होम' },
    { href: '/workers', label: 'सेवाएँ' },
    { href: '/categories', label: 'Category' },
    { href: '/about', label: 'हमारे बारे में' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-brand-navy shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 min-h-0">
            <div className="w-8 h-8 bg-brand-yellow rounded-lg flex items-center justify-center flex-shrink-0">
              <Wrench size={18} className="text-brand-navy" />
            </div>
            <span className="font-black text-xl text-white tracking-tight">
              KAAM<span className="text-brand-yellow">SETU</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href}
                className="text-white/80 hover:text-brand-yellow text-sm font-medium transition-colors font-hindi min-h-0">
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
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
                    {roleLinks.map(l => (
                      <Link key={l.href} href={l.href} onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 text-sm min-h-0">
                        <l.icon size={15} className="text-brand-navy" />
                        {l.label}
                      </Link>
                    ))}
                    <hr className="my-1 border-gray-100" />
                    <button onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-red-600 hover:bg-red-50 text-sm min-h-0">
                      <LogOut size={15} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login"
                  className="border border-white/40 text-white hover:border-white rounded-xl px-4 py-2 text-sm font-medium transition-colors min-h-0">
                  Login
                </Link>
                <Link href="/auth/select-role"
                  className="bg-brand-yellow text-brand-navy font-bold rounded-xl px-4 py-2 text-sm hover:bg-amber-400 transition-colors min-h-0 font-hindi">
                  साइन अप करें
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(true)}
            className="lg:hidden text-white p-2 min-h-0" aria-label="Open menu">
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-brand-navy flex flex-col">
          <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
            <span className="font-black text-xl text-white">KAAM<span className="text-brand-yellow">SETU</span></span>
            <button onClick={() => setMenuOpen(false)} className="text-white p-2 min-h-0" aria-label="Close menu">
              <X size={24} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                className="block py-3 px-4 text-white/90 hover:text-brand-yellow hover:bg-white/5 rounded-xl font-hindi text-lg min-h-0">
                {l.label}
              </Link>
            ))}
            {user && (
              <>
                <hr className="border-white/10 my-4" />
                {roleLinks.map(l => (
                  <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 py-3 px-4 text-white/90 hover:bg-white/5 rounded-xl min-h-0">
                    <l.icon size={18} />
                    <span>{l.label}</span>
                  </Link>
                ))}
                <button onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="flex items-center gap-3 w-full py-3 px-4 text-red-400 hover:bg-white/5 rounded-xl min-h-0">
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            )}
          </nav>
          {!user && (
            <div className="p-4 space-y-3 border-t border-white/10">
              <Link href="/auth/login" onClick={() => setMenuOpen(false)}
                className="block w-full text-center border border-white/40 text-white rounded-xl py-3 font-medium min-h-0">
                Login
              </Link>
              <Link href="/auth/select-role" onClick={() => setMenuOpen(false)}
                className="block w-full text-center bg-brand-yellow text-brand-navy font-bold rounded-xl py-3 font-hindi min-h-0">
                साइन अप करें
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
