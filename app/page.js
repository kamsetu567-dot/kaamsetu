'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MapPin, Users, Briefcase, Shield, Search, MessageCircle, CheckCircle, BadgeCheck, Zap, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdSlot from '@/components/AdSlot';
import { useLang } from '@/lib/context/LanguageContext';
import { useT } from '@/lib/i18n/useT';
import { CATEGORIES } from '@/lib/data/categories';

// Flat list of all searchable terms — category names + every subcategory
const SEARCH_SUGGESTIONS = [
  ...CATEGORIES.flatMap(c => [
    { label: `${c.nameHi} / ${c.nameEn}`, query: c.nameEn },
    ...c.subcategories.map(sub => ({ label: sub, query: sub })),
  ]),
  // Extra popular standalone terms
  { label: 'Mistri / मिस्त्री',          query: 'Mistri' },
  { label: 'Plumber / प्लंबर',          query: 'Plumber' },
  { label: 'Electrician / इलेक्ट्रीशियन', query: 'Electrician' },
  { label: 'Painter / पेंटर',           query: 'Painter' },
  { label: 'Driver / ड्राइवर',           query: 'Driver' },
  { label: 'Cook / रसोइया',             query: 'Cook' },
  { label: 'Maid / कामवाली',            query: 'Maid' },
  { label: 'Tutor / ट्यूटर',             query: 'Tutor' },
  { label: 'Security Guard',            query: 'Security Guard' },
  { label: 'Delivery Boy',              query: 'Delivery Boy' },
  { label: 'Data Entry',               query: 'Data Entry' },
  { label: 'Accountant / अकाउंटेंट',     query: 'Accountant' },
].filter((item, i, arr) => arr.findIndex(x => x.query === item.query) === i); // deduplicate by query


// Hero illustrations that crossfade in the hero spotlight (transparent PNGs)
const HERO_ILLUSTRATIONS = [
  '/illustrations/worker-hero-2.png',
  '/illustrations/hero-carpenter.png',
  '/illustrations/hero-electrician.png',
  '/illustrations/hero-plumber.png',
  '/illustrations/hero-caterer.png',
  '/illustrations/hero-computer-operator.png',
];

// Quick-access service icon tiles (all shown at once — no "show more")
const SERVICE_TILES = [
  { icon: '/icons/mistri.png',       hi: 'मिस्त्री',         en: 'Mistri',          count: '200+', bg: 'bg-orange-50',  href: '/workers?q=mistri' },
  { icon: '/icons/plumber.png',      hi: 'प्लंबर',           en: 'Plumber',         count: '150+', bg: 'bg-blue-50',    href: '/workers?q=plumber' },
  { icon: '/icons/electrician.png',  hi: 'इलेक्ट्रीशियन',    en: 'Electrician',     count: '180+', bg: 'bg-yellow-50',  href: '/workers?q=electrician' },
  { icon: '/icons/painter.png',      hi: 'पेंटर',            en: 'Painter',         count: '120+', bg: 'bg-pink-50',    href: '/workers?q=painter' },
  { icon: '/icons/carpenter.png',    hi: 'कारपेंटर',         en: 'Carpenter',       count: '100+', bg: 'bg-amber-50',   href: '/workers?q=carpenter' },
  { icon: '/icons/driver.png',       hi: 'ड्राइवर',          en: 'Driver',          count: '250+', bg: 'bg-cyan-50',    href: '/workers?category=vehicle-travel' },
  { icon: '/icons/caterer.png',      hi: 'कैटरर',            en: 'Caterer',         count: '80+',  bg: 'bg-green-50',   href: '/workers?q=caterer' },
  { icon: '/icons/dj.png',           hi: 'DJ',               en: 'DJ',              count: '60+',  bg: 'bg-purple-50',  href: '/workers?q=dj' },
  { icon: '/icons/dancer.png',       hi: 'डांसर',            en: 'Dancer',          count: '50+',  bg: 'bg-rose-50',    href: '/workers?q=dancer' },
  { icon: '/icons/singer.png',       hi: 'सिंगर',            en: 'Singer',          count: '40+',  bg: 'bg-indigo-50',  href: '/workers?q=singer' },
  { icon: '/icons/tutor.png',        hi: 'ट्यूटर',           en: 'Tutor',           count: '90+',  bg: 'bg-teal-50',    href: '/workers?category=talent-training' },
  { icon: '/icons/caretaker.png',    hi: 'होम केयरटेकर',     en: 'Home Caretaker',  count: '70+',  bg: 'bg-sky-50',     href: '/workers?category=home-care-living' },
  { icon: '/icons/security.png',     hi: 'सिक्योरिटी',       en: 'Security',        count: '60+',  bg: 'bg-slate-50',   href: '/workers?category=security-event-safety' },
  { icon: '/icons/logistics.png',    hi: 'होम लॉजिस्टिक',    en: 'Logistics',       count: '50+',  bg: 'bg-lime-50',    href: '/workers?category=packing-logistics' },
  { icon: '/icons/packing.png',      hi: 'पैकिंग सर्विस',    en: 'Packing',         count: '40+',  bg: 'bg-orange-50',  href: '/workers?q=packing' },
];

const ACTION_CARDS = [
  {
    illustration: '/illustrations/worker-hero.png',
    title: { hi: 'वर्कर ढूंढें',  en: 'Find a Worker' },
    desc:  { hi: 'अपने काम के लिए सही वर्कर ढूंढें', en: 'Find the right worker for your job' },
    btn:   { hi: 'अभी खोजें',     en: 'Search Now' },
    btnColor: 'bg-brand-navy text-white',
    href: '/workers',
    imgW: 180, imgH: 200,
  },
  {
    illustration: '/illustrations/team-illustration.png',
    title: { hi: 'टीम बनाएं',   en: 'Build a Team' },
    desc:  { hi: 'अपनी टीम बनाएं और ज्यादा काम पाएं', en: 'Build your team and get more work' },
    btn:   { hi: 'टीम बनाएं',   en: 'Build Team' },
    btnColor: 'bg-green-600 text-white',
    href: '/auth/select-role',
    imgW: 180, imgH: 200,
  },
  {
    illustration: '/illustrations/shop-illustration.png',
    title: { hi: 'दुकान जोड़ें',  en: 'Add Your Shop' },
    desc:  { hi: 'अपनी दुकान रजिस्टर करें और ग्राहकों तक पहुंचाएं', en: 'Register your shop and reach customers' },
    btn:   { hi: 'दुकान जोड़ें',  en: 'Add Shop' },
    btnColor: 'bg-orange-500 text-white',
    href: '/auth/signup/shop',
    imgW: 180, imgH: 200,
  },
];

export default function HomePage() {
  const router = useRouter();
  const { lang } = useLang();
  const t = useT();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [role, setRole] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [heroIdx, setHeroIdx] = useState(0);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('kaamsetu_user') || '{}');
      setRole(user.role || null);
    } catch {}
  }, []);

  // Crossfade through the hero illustrations every 4s. Skips animation if the
  // user prefers reduced motion.
  useEffect(() => {
    if (typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const id = setInterval(() => {
      setHeroIdx(i => (i + 1) % HERO_ILLUSTRATIONS.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onClickOutside(e) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleQueryChange(e) {
    const val = e.target.value;
    setSearchQuery(val);
    setActiveIdx(-1);
    if (val.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const q = val.toLowerCase();
    const matches = SEARCH_SUGGESTIONS.filter(s =>
      s.label.toLowerCase().includes(q) || s.query.toLowerCase().includes(q)
    ).slice(0, 8);
    setSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  }

  function selectSuggestion(item) {
    setSearchQuery(item.query);
    setShowSuggestions(false);
    setSuggestions([]);
    // Auto-submit
    const params = new URLSearchParams();
    params.set('q', item.query);
    if (searchCity) params.set('city', searchCity);
    if (searchCategory) params.set('category', searchCategory);
    router.push(`/workers?${params.toString()}`);
  }

  function handleKeyDown(e) {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIdx]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setShowSuggestions(false);
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (searchCity) params.set('city', searchCity);
    if (searchCategory) params.set('category', searchCategory);
    router.push(`/workers?${params.toString()}`);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="gradient-hero overflow-x-hidden relative">
        {/* Decorative background — soft glows + dotted grid */}
        <div className="hero-decor" aria-hidden="true">
          <div className="hero-dots" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 md:pt-20 pb-0 relative z-10">
          <div className="grid md:grid-cols-2 gap-6 md:min-h-[520px]">

            {/* left */}
            <div className="flex flex-col justify-center pb-14 md:pb-20">
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-5">
                <span className="text-brand-yellow text-xs">⭐</span>
                <span className="text-white/90 text-xs font-medium font-hindi">{t({ hi: 'भारत का #1 लोकल सर्विस प्लेटफ़ॉर्म', en: "India's #1 Local Service Platform" })}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 font-hindi leading-tight break-words">
                {t({ hi: 'हर काम, हर जगह', en: 'Every Work, Everywhere' })}
              </h1>
              <p className="text-xl sm:text-2xl font-bold text-brand-yellow mb-4 font-hindi break-words">
                {t({ hi: 'सही वर्कर अब एक क्लिक पर!', en: 'The right worker — one click away!' })}
              </p>
              <p className="text-white/70 mb-8 font-hindi text-sm">
                {t({ hi: 'मिस्त्री, प्लंबर, कैटरर, डांसर, ट्यूटर — सभी सेवाएँ एक ही जगह', en: 'Mistri, Plumber, Caterer, Dancer, Tutor — All in one place' })}
              </p>

              {/* Search bar */}
              <form onSubmit={handleSearch}
                className="bg-white rounded-2xl shadow-2xl p-2.5 mb-7 flex flex-col sm:flex-row gap-2">
                <select value={searchCategory} onChange={e => setSearchCategory(e.target.value)}
                  className="sm:w-40 px-3 py-2.5 rounded-xl border border-gray-100 text-gray-600 text-sm focus:outline-none focus:border-brand-navy bg-gray-50 font-hindi">
                  <option value="">{t({ hi: 'सभी कैटेगरी', en: 'All Categories' })}</option>
                  <option value="construction-repair">{t({ hi: 'मिस्त्री / प्लंबर', en: 'Mistri / Plumber' })}</option>
                  <option value="event-services">{t({ hi: 'इवेंट सेवाएँ', en: 'Event Services' })}</option>
                  <option value="home-services">{t({ hi: 'घरेलू सेवाएँ', en: 'Home Services' })}</option>
                  <option value="talent-training">{t({ hi: 'ट्यूटर / ट्रेनर', en: 'Tutor / Trainer' })}</option>
                  <option value="vehicle-travel">{t({ hi: 'ड्राइवर / वाहन', en: 'Driver / Vehicle' })}</option>
                  <option value="beauty-personal-care">{t({ hi: 'ब्यूटी सर्विस', en: 'Beauty Service' })}</option>
                  <option value="repair-technical">{t({ hi: 'रिपेयर सेवाएँ', en: 'Repair Services' })}</option>
                  <option value="jobs-staff-office">{t({ hi: 'जॉब्स / स्टाफ', en: 'Jobs / Staff' })}</option>
                </select>

                <div className="relative flex-1" ref={suggestionsRef}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleQueryChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder={t({ hi: 'आपको क्या चाहिए? (जैसे — Plumber, Painter)', en: 'What do you need? (e.g. Plumber, Painter)' })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-brand-navy font-hindi"
                    autoComplete="off"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                      {suggestions.map((item, i) => (
                        <li
                          key={item.query}
                          onMouseDown={() => selectSuggestion(item)}
                          className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                            i === activeIdx ? 'bg-brand-navy text-white' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Search size={13} className={i === activeIdx ? 'text-white/70' : 'text-gray-400'} />
                          <span className="font-hindi">{item.label}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="relative">
                    <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={searchCity} onChange={e => setSearchCity(e.target.value)}
                      placeholder={t({ hi: 'आपका शहर', en: 'Your city' })}
                      className="w-28 pl-8 pr-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-brand-navy font-hindi" />
                  </div>
                  <button type="submit"
                    className="bg-brand-yellow text-brand-navy font-bold px-5 py-2.5 rounded-xl hover:bg-amber-400 transition-colors font-hindi text-sm whitespace-nowrap">
                    {t({ hi: 'खोजें', en: 'Search' })}
                  </button>
                </div>
              </form>

              {/* Stats */}
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {[
                  { icon: Users,     val: '1000+', label: { hi: 'वर्कर्स',       en: 'Workers' } },
                  { icon: Briefcase, val: '500+',  label: { hi: 'दैनिक जॉब्स',   en: 'Daily Jobs' } },
                  { icon: Shield,    val: '50+',   label: { hi: 'कैटेगरी',        en: 'Categories' } },
                  { icon: MapPin,    val: '100+',  label: { hi: 'शहरों में सेवा', en: 'Cities' } },
                ].map(s => (
                  <div key={s.label.en} className="flex items-center gap-2">
                    <s.icon size={15} className="text-brand-yellow flex-shrink-0" />
                    <div>
                      <span className="text-white font-bold text-sm">{s.val} </span>
                      <span className="text-white/60 text-xs font-hindi">{t(s.label)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 mt-8">
                <Link
                  href={role === 'client' ? '/client/request-service' : role === 'worker' ? '/worker/dashboard' : role === 'shop' ? '/shop/dashboard' : '/auth/select-role'}
                  className="bg-brand-yellow text-brand-navy font-bold px-6 py-3 rounded-xl hover:bg-amber-400 transition-colors font-hindi leading-none flex items-center justify-center">
                  {role === 'client' ? t({ hi: 'काम करवाएँ', en: 'Request Service' })
                    : role === 'worker' ? t({ hi: 'मेरा डैशबोर्ड', en: 'My Dashboard' })
                    : role === 'shop' ? t({ hi: 'Shop Dashboard', en: 'Shop Dashboard' })
                    : t({ hi: 'काम करवाएँ', en: 'Hire a Worker' })}
                </Link>
                <Link
                  href={role === 'worker' ? '/worker/dashboard/jobs' : role === 'client' ? '/workers' : role === 'shop' ? '/shop/ads' : '/auth/select-role'}
                  className="border-2 border-white text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors font-hindi leading-none flex items-center justify-center">
                  {role === 'worker' ? t({ hi: 'मेरी Jobs', en: 'My Jobs' })
                    : role === 'client' ? t({ hi: 'Workers ढूंढें', en: 'Find Workers' })
                    : role === 'shop' ? t({ hi: 'मेरे ऐड्स', en: 'My Ads' })
                    : t({ hi: 'काम ढूंढें', en: 'Find Work' })}
                </Link>
              </div>
            </div>

            {/* right — crossfading hero illustrations with moving yellow glow behind */}
            <div className="flex justify-center items-end self-end">
              <div className="hero-stage">
                {/* Moving yellow glow behind the worker */}
                <span className="hero-glow-disc" aria-hidden="true" />
                {/* Single image whose src swaps every 5s. key forces a remount so
                    the change is always visible (no opacity-stacking issues). */}
                <img
                  key={heroIdx}
                  src={HERO_ILLUSTRATIONS[heroIdx]}
                  alt="KaamSetu verified worker"
                  className="hero-stage-img is-active hero-stage-fade"
                />
                {/* Preload the rest so swaps are instant */}
                <div style={{ display: 'none' }} aria-hidden="true">
                  {HERO_ILLUSTRATIONS.map(src => <img key={src} src={src} alt="" />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICE ICONS ────────────────────────────────────────── */}
      <section className="bg-white pt-14 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-px w-16 bg-brand-navy/25" />
              <h2 className="text-2xl md:text-3xl font-black text-brand-navy font-hindi">{t({ hi: 'सेवाएं', en: 'Services' })}</h2>
              <div className="h-px w-16 bg-brand-navy/25" />
            </div>
            <p className="text-gray-500 text-sm font-hindi">{t({ hi: 'अपनी ज़रूरत की सेवा चुनें', en: 'Pick the service you need' })}</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
            {SERVICE_TILES.map(tile => (
              <Link
                key={tile.en}
                href={tile.href}
                className={`${tile.bg} rounded-2xl p-3 sm:p-4 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-0.5 transition-all border border-transparent hover:border-gray-200`}
              >
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 mb-2">
                  <Image src={tile.icon} alt={t(tile)} fill className="object-contain" sizes="56px" unoptimized />
                </div>
                <p className="text-xs sm:text-sm font-bold text-brand-navy font-hindi leading-tight">{t(tile)}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{tile.count}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── POPULAR SERVICES ─────────────────────────────────────── */}
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AdSlot variant="banner-wide" limit={9} heading={t({ hi: 'विज्ञापन', en: 'Advertisements' })} className="mb-8" />
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-px w-16 bg-brand-navy/25" />
              <h2 className="text-2xl md:text-3xl font-black text-brand-navy font-hindi">{t({ hi: 'लोकप्रिय सेवाएं', en: 'Popular Services' })}</h2>
              <div className="h-px w-16 bg-brand-navy/25" />
            </div>
            <p className="text-gray-500 text-sm font-hindi">{t({ hi: 'आपको जो भी काम चाहिए, हमारे पास सही वर्कर है', en: 'Whatever work you need, we have the right worker' })}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {(showAllCategories ? CATEGORIES : CATEGORIES.slice(0, 8)).map(cat => (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="relative overflow-hidden rounded-2xl group block h-40 sm:h-44"
                aria-label={`${cat.nameEn} — ${cat.nameHi}`}
              >
                <Image
                  src={cat.image}
                  alt={cat.nameEn}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-black text-sm leading-tight drop-shadow font-hindi">{t({ hi: cat.nameHi, en: cat.nameEn })}</p>
                </div>
                <div className="absolute inset-0 border-4 border-transparent group-hover:border-brand-yellow rounded-2xl transition-colors duration-200 pointer-events-none" />
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            {showAllCategories ? (
              <Link href="/categories"
                className="inline-flex items-center gap-2 bg-brand-navy text-white font-bold px-6 py-2.5 rounded-xl hover:bg-brand-navy-dark transition-colors font-hindi text-sm">
                {t({ hi: 'सभी सेवाएँ देखें', en: 'View All Services' })} <ArrowRight size={15} />
              </Link>
            ) : (
              <button onClick={() => setShowAllCategories(true)}
                className="inline-flex items-center gap-2 bg-brand-navy text-white font-bold px-6 py-2.5 rounded-xl hover:bg-brand-navy-dark transition-colors font-hindi text-sm">
                {t({ hi: 'सभी सेवाएँ देखें', en: 'View All Services' })} <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── INTRO VIDEO ──────────────────────────────────────────── */}
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            {/* Left half — video (admin-uploaded; placeholder for now) */}
            <div className="relative w-full aspect-video bg-brand-navy/5 border-2 border-dashed border-gray-300 rounded-3xl overflow-hidden flex items-center justify-center">
              {/* TODO: replace with admin-uploaded video player */}
              <div className="text-center text-gray-400">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                </div>
                <p className="text-sm font-semibold">Video coming soon</p>
              </div>
            </div>

            {/* Right half — content (blank for now) */}
            <div className="min-h-[200px] md:min-h-full flex items-center">
              {/* TODO: content goes here */}
            </div>
          </div>
        </div>
      </section>

      {/* ── ACTION CARDS ─────────────────────────────────────────── */}
      <section className="bg-brand-bg py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {ACTION_CARDS.map(card => {
              let resolvedHref = card.href;
              if (role === 'worker') {
                if (card.href === '/workers')          resolvedHref = '/worker/dashboard';
                if (card.href === '/auth/select-role') resolvedHref = '/worker/dashboard';
                if (card.href === '/auth/signup/shop') resolvedHref = '/worker/dashboard';
              } else if (role === 'client') {
                if (card.href === '/workers')          resolvedHref = '/workers';
                if (card.href === '/auth/select-role') resolvedHref = '/client/request-service';
                if (card.href === '/auth/signup/shop') resolvedHref = '/client/dashboard';
              } else if (role === 'shop') {
                resolvedHref = '/shop/dashboard';
              }
              return (
                <div key={card.title.en}
                  className="bg-white rounded-3xl p-4 sm:p-5 flex flex-col items-center text-center shadow-sm card-hover border border-gray-100">
                  <div className="relative mb-4 w-28 h-32 sm:w-36 sm:h-40 md:w-44 md:h-48 mx-auto">
                    <Image
                      src={card.illustration}
                      alt={t(card.title)}
                      fill
                      className="object-contain"
                      sizes="(max-width:640px) 112px, (max-width:768px) 144px, 176px"
                    />
                  </div>
                  <h3 className="font-black text-brand-navy font-hindi text-base mb-1">{t(card.title)}</h3>
                  <p className="text-gray-500 text-xs font-hindi mb-4 leading-snug">{t(card.desc)}</p>
                  <Link href={resolvedHref}
                    className={`${card.btnColor} mt-auto w-full font-bold text-sm py-3 rounded-xl hover:opacity-90 transition-opacity font-hindi leading-none flex items-center justify-center`}>
                    {t(card.btn)}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-brand-navy py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-white font-hindi mb-1">{t({ hi: 'कैसे काम करता है?', en: 'How Does It Work?' })}</h2>
            <p className="text-white/50 text-sm">{t({ hi: '3 आसान स्टेप्स', en: '3 simple steps' })}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Search,        step: '1',
                title: { hi: 'सेवा चुनें',      en: 'Choose Service' },
                desc:  { hi: 'अपनी जरूरत के अनुसार category और service चुनें', en: 'Choose a category and service according to your need' } },
              { icon: Briefcase,     step: '2',
                title: { hi: 'Request भेजें',   en: 'Send Request' },
                desc:  { hi: 'अपना नाम, मोबाइल और काम की जानकारी भरें', en: 'Fill in your name, mobile, and work details' } },
              { icon: MessageCircle, step: '3',
                title: { hi: 'Worker से मिलें', en: 'Meet Your Worker' },
                desc:  { hi: 'हम आपको verified worker से तुरंत connect करेंगे', en: "We'll instantly connect you with a verified worker" } },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-16 h-16 bg-brand-yellow rounded-2xl flex items-center justify-center">
                    <s.icon size={28} className="text-brand-navy" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-brand-navy font-black text-sm">
                    {s.step}
                  </span>
                </div>
                <h3 className="text-white font-bold text-lg font-hindi mb-1">{t(s.title)}</h3>
                <p className="text-white/70 text-sm font-hindi">{t(s.desc)}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/auth/select-role"
              className="bg-brand-yellow text-brand-navy font-bold px-8 py-3 rounded-xl hover:bg-amber-400 transition-colors font-hindi">
              {t({ hi: 'अभी शुरू करें', en: 'Get Started' })}
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY KAAMSETU ─────────────────────────────────────────── */}
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-brand-navy font-hindi mb-1">{t({ hi: 'KaamSetu क्यों चुनें?', en: 'Why Choose KaamSetu?' })}</h2>
            <p className="text-gray-500 text-sm">{t({ hi: 'भरोसेमंद, तेज़, सुरक्षित', en: 'Trusted, Fast, Secure' })}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BadgeCheck,    title: { hi: 'वेरिफाइड वर्कर',       en: 'Verified Workers' }, iconBg: 'bg-white', color: 'text-brand-navy',  card: 'bg-gradient-to-br from-blue-50 to-blue-100/60 border-blue-200',     num: 'bg-brand-navy' },
              { icon: MessageCircle, title: { hi: 'सीधी बातचीत',          en: 'Direct Contact'   }, iconBg: 'bg-white', color: 'text-green-600',   card: 'bg-gradient-to-br from-green-50 to-green-100/60 border-green-200',   num: 'bg-green-600' },
              { icon: Shield,        title: { hi: 'सुरक्षित और भरोसेमंद', en: 'Safe & Trusted'   }, iconBg: 'bg-white', color: 'text-purple-600',  card: 'bg-gradient-to-br from-purple-50 to-purple-100/60 border-purple-200', num: 'bg-purple-600' },
              { icon: Zap,           title: { hi: 'तेज़ और आसान',          en: 'Fast & Easy'      }, iconBg: 'bg-white', color: 'text-amber-500',   card: 'bg-gradient-to-br from-amber-50 to-amber-100/60 border-amber-200',   num: 'bg-amber-500' },
            ].map((f, i) => (
              <div key={f.title.en} className={`relative text-center p-6 rounded-2xl border-2 card-hover ${f.card}`}>
                <span className={`absolute top-3 left-3 w-7 h-7 rounded-full ${f.num} text-white text-sm font-black flex items-center justify-center shadow-sm`}>
                  {i + 1}
                </span>
                <div className={`w-14 h-14 ${f.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm`}>
                  <f.icon size={26} className={f.color} />
                </div>
                <h3 className="font-bold text-brand-navy font-hindi mb-1">{t(f.title)}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORKER CTA ───────────────────────────────────────────── */}
      <section className="py-14 px-4" style={{ background: 'linear-gradient(135deg,#F5A623 0%,#F59E0B 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-end">
            <div>
              <h2 className="text-3xl font-black text-brand-navy font-hindi mb-1">{t({ hi: 'वर्कर बनें और कमाई शुरू करें', en: 'Become a Worker & Start Earning' })}</h2>
              <p className="text-brand-navy/60 text-sm mb-1">{t({ hi: 'KaamSetu वर्कर बनें', en: 'Join KaamSetu Today' })}</p>
              <p className="text-brand-navy font-bold text-lg mb-5 font-hindi">{t({ hi: 'सिर्फ ₹199 में पूरा महीना', en: 'Full month for just ₹199' })}</p>
              <ul className="space-y-2 mb-6">
                {[
                  { hi: 'रोज नए काम पाएँ',              en: 'Get new work every day' },
                  { hi: 'अपने प्रोफाइल से क्लाइंट पाएँ', en: 'Get clients from your profile' },
                  { hi: 'सीधे संपर्क करें',               en: 'Direct contact with clients' },
                ].map(item => (
                  <li key={item.en} className="flex items-center gap-2 text-brand-navy font-hindi text-sm">
                    <CheckCircle size={16} className="flex-shrink-0" />
                    {t(item)}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup/worker"
                className="inline-block bg-brand-navy text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-navy-dark transition-colors font-hindi">
                {t({ hi: 'अभी रजिस्टर करें', en: 'Register Now' })}
              </Link>
            </div>
            <div className="hidden md:flex justify-center items-end">
              <Image
                src="/illustrations/worker-hero-full.png"
                alt="Become a KaamSetu worker"
                width={640}
                height={358}
                className="object-contain drop-shadow-xl w-full max-w-xl"
                unoptimized
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
