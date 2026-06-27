'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MapPin, Users, Briefcase, Shield, Search, MessageCircle, CheckCircle, BadgeCheck, Zap, Megaphone, Store, Wrench, Star } from 'lucide-react';
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
  { label: 'Mistri / मिस्त्री', query: 'Mistri' },
  { label: 'Plumber / प्लंबर', query: 'Plumber' },
  { label: 'Electrician / इलेक्ट्रीशियन', query: 'Electrician' },
  { label: 'Painter / पेंटर', query: 'Painter' },
  { label: 'Driver / ड्राइवर', query: 'Driver' },
  { label: 'Cook / रसोइया', query: 'Cook' },
  { label: 'Maid / कामवाली', query: 'Maid' },
  { label: 'Tutor / ट्यूटर', query: 'Tutor' },
  { label: 'Security Guard', query: 'Security Guard' },
  { label: 'Delivery Boy', query: 'Delivery Boy' },
  { label: 'Data Entry', query: 'Data Entry' },
  { label: 'Accountant / अकाउंटेंट', query: 'Accountant' },
].filter((item, i, arr) => arr.findIndex(x => x.query === item.query) === i); // deduplicate by query


// Single static hero illustration — no rotation, no fade, no glow.
const HERO_IMAGE = '/illustrations/hero-group.png';

// Category icon tiles — one per top-level service category
const SERVICE_TILES = [
  // ── Top row: 12 broad categories (PNG icons already in /public/icons) ──
  { icon: '/icons/construction-repair.png',  hi: 'निर्माण और मरम्मत',     en: 'Construction & Repair',   bg: 'bg-orange-50',  href: '/categories/construction-repair' },
  { icon: '/icons/home-services.png',        hi: 'घरेलू सेवाएँ',           en: 'Home Services',           bg: 'bg-blue-50',    href: '/categories/home-services' },
  { icon: '/icons/event-services.png',       hi: 'इवेंट सेवाएँ',           en: 'Event Services',          bg: 'bg-violet-50',  href: '/categories/event-services' },
  { icon: '/icons/talent-training.png',      hi: 'हुनर और प्रशिक्षण',     en: 'Talent & Training',       bg: 'bg-purple-50',  href: '/categories/talent-training' },
  { icon: '/icons/beauty-personal-care.png', hi: 'सौंदर्य सेवाएँ',          en: 'Beauty & Personal Care',  bg: 'bg-rose-50',    href: '/categories/beauty-personal-care' },
  { icon: '/icons/vehicle-travel.png',       hi: 'वाहन और यात्रा',         en: 'Vehicle & Travel',        bg: 'bg-cyan-50',    href: '/categories/vehicle-travel' },
  { icon: '/icons/shop-retail.png',          hi: 'दुकानें और सामग्री',     en: 'Shops & Materials',       bg: 'bg-yellow-50',  href: '/categories/shops-materials' },
  { icon: '/icons/repair-technical.png',     hi: 'मरम्मत और तकनीकी',       en: 'Repair & Technical',      bg: 'bg-slate-50',   href: '/categories/repair-technical' },
  { icon: '/icons/home-care.png',            hi: 'होम केयर',               en: 'Home Care & Living',      bg: 'bg-red-50',     href: '/categories/home-care-living' },
  { icon: '/icons/security-services.png',    hi: 'सुरक्षा सेवाएँ',         en: 'Security Services',       bg: 'bg-indigo-50',  href: '/categories/security-event-safety' },
  { icon: '/icons/packing-logistics.png',    hi: 'पैकिंग और लॉजिस्टिक्स',   en: 'Packing & Logistics',     bg: 'bg-teal-50',    href: '/categories/packing-logistics' },
  { icon: '/icons/office-work.png',          hi: 'जॉब्स / स्टाफ / ऑफिस',   en: 'Jobs / Staff / Office',   bg: 'bg-emerald-50', href: '/categories/jobs-staff-office' },
  // ── Next 12: popular specific services. Drop matching PNGs into /public/icons/.
  // Each links straight to the category page with a subcategory pre-filter so the
  // worker list opens scoped to that exact trade. ──
  { icon: '/icons/plumber.png',         hi: 'प्लंबर',              en: 'Plumber',          bg: 'bg-sky-50',     href: '/categories/construction-repair?subcategory=Plumber' },
  { icon: '/icons/electrician.png',     hi: 'इलेक्ट्रीशियन',        en: 'Electrician',      bg: 'bg-amber-50',   href: '/categories/construction-repair?subcategory=Electrician' },
  { icon: '/icons/carpenter.png',       hi: 'कारपेंटर',             en: 'Carpenter',        bg: 'bg-yellow-50',  href: '/categories/construction-repair?subcategory=Carpenter' },
  { icon: '/icons/painter.png',         hi: 'पेंटर',               en: 'Painter',          bg: 'bg-fuchsia-50', href: '/categories/construction-repair?subcategory=Painter' },
  { icon: '/icons/ac-repair.png',       hi: 'AC रिपेयर',           en: 'AC Repair',        bg: 'bg-cyan-50',    href: '/categories/repair-technical?subcategory=AC%20Repair' },
  { icon: '/icons/mobile-repair.png',   hi: 'मोबाइल रिपेयर',        en: 'Mobile Repair',    bg: 'bg-lime-50',    href: '/categories/repair-technical?subcategory=Mobile%20Repair' },
  { icon: '/icons/maid.png',            hi: 'कामवाली / मेड',        en: 'Maid',             bg: 'bg-pink-50',    href: '/categories/home-services?subcategory=Maid' },
  { icon: '/icons/cook.png',            hi: 'रसोइया / कुक',         en: 'Cook',             bg: 'bg-orange-50',  href: '/categories/home-services?subcategory=Cook' },
  { icon: '/icons/driver.png',          hi: 'ड्राइवर',              en: 'Driver',           bg: 'bg-blue-50',    href: '/categories/vehicle-travel?subcategory=Driver' },
  { icon: '/icons/photographer.png',    hi: 'फोटोग्राफर',           en: 'Photographer',     bg: 'bg-rose-50',    href: '/categories/event-services?subcategory=Photographer' },
  { icon: '/icons/bridal-makeup.png',   hi: 'ब्राइडल मेकअप',         en: 'Bridal Makeup',    bg: 'bg-pink-50',    href: '/categories/beauty-personal-care?subcategory=Bridal%20Makeup' },
  { icon: '/icons/tutor.png',           hi: 'ट्यूशन / ट्यूटर',       en: 'Tutor',            bg: 'bg-purple-50',  href: '/categories/talent-training?subcategory=Tuition' },
];

// Four homepage entry-points. All four land on /auth/select-role which
// handles signed-in users (auto-routes by active role) and guests (role
// picker → signup) intelligently.
// Each tile carries a `role` it represents + a `signupHref` (where guests go,
// or where logged-in users without this role go to add it) + a `dashboardHref`
// (where logged-in users who already have this role go for that action).
// Smart routing lives in `tileHref(card, currentRole, currentRoles)` below.
const ACTION_CARDS = [
  {
    illustration: '/illustrations/worker-hero.png',
    title: { hi: 'काम करवाओ', en: 'Hire Worker' },
    desc: { hi: 'अपने काम के लिए सही वर्कर ढूंढें', en: 'Find the right worker for your job' },
    btn: { hi: 'अभी खोजें', en: 'Get Started' },
    btnColor: 'bg-brand-navy text-white',
    role: 'client',
    signupHref: '/auth/signup/client',
    dashboardHref: '/client/request-service',
    imgW: 180, imgH: 200,
    Icon: Wrench, iconBg: 'bg-orange-100', iconColor: 'text-orange-600',
    subtitle: { en: 'Hire Worker' },
  },
  {
    illustration: '/illustrations/team-illustration.png',
    title: { hi: 'काम ढूंढो', en: 'Find Work' },
    desc: { hi: 'Worker बनें और अपने हुनर का काम पाएँ', en: 'Join as a worker and get matching jobs' },
    btn: { hi: 'अभी शुरू करें', en: 'Get Started' },
    btnColor: 'bg-green-600 text-white',
    role: 'worker',
    signupHref: '/auth/signup/worker',
    dashboardHref: '/worker/dashboard/jobs',
    imgW: 180, imgH: 200,
    Icon: Search, iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
    subtitle: { en: 'Find Work' },
  },
  {
    illustration: '/illustrations/team-illustration.png',
    title: { hi: 'टीम / पार्टनर', en: 'Join as Partner' },
    desc: { hi: 'टीम लीडर बनें या पार्टनर के तौर पर जुड़ें', en: 'Lead a team or partner with us' },
    btn: { hi: 'अभी शुरू करें', en: 'Get Started' },
    btnColor: 'bg-purple-600 text-white',
    role: 'worker',
    signupHref: '/auth/signup/worker?as=partner',
    dashboardHref: '/worker/dashboard',
    imgW: 180, imgH: 200,
    Icon: Users, iconBg: 'bg-purple-100', iconColor: 'text-purple-600',
    subtitle: { en: 'Join as Partner' },
  },
  {
    illustration: '/illustrations/shop-illustration.png',
    title: { hi: 'शॉप / ऐड्स', en: 'Shop / Ads' },
    desc: { hi: 'अपनी दुकान रजिस्टर करें और ऐड लगाएं', en: 'Register your shop and run ads' },
    btn: { hi: 'अभी शुरू करें', en: 'Get Started' },
    btnColor: 'bg-orange-500 text-white',
    role: 'shop',
    signupHref: '/auth/signup/shop',
    dashboardHref: '/shop/ads',
    imgW: 180, imgH: 200,
    Icon: Store, iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
    subtitle: { en: 'Shop / Ads' },
  },
];

// Smart tile routing: guests → role-specific signup. Logged-in users who
// already have that role → their action page. Logged-in users without
// that role → signup page for the new role (multi-role User supports
// adding additional roles to one account).
function tileHref(card, role, roles) {
  if (!role) return card.signupHref; // guest
  const hasRole = Array.isArray(roles) ? roles.includes(card.role) : role === card.role;
  return hasRole ? card.dashboardHref : card.signupHref;
}

// Fake top-rated worker data. Twenty-four entries; we shuffle on mount and
// surface seven in the marquee, so each page load shows a different sample.
const TOP_WORKERS_POOL = [
  { name: 'Rakesh Kumar',   trade: 'Plumber',     rating: 4.9, accent: 'bg-sky-100' },
  { name: 'Suresh Yadav',   trade: 'Electrician', rating: 4.9, accent: 'bg-amber-100' },
  { name: 'Vikram Singh',   trade: 'Carpenter',   rating: 4.8, accent: 'bg-yellow-100' },
  { name: 'Anil Sharma',    trade: 'AC Repair',   rating: 4.9, accent: 'bg-cyan-100' },
  { name: 'Priya Devi',     trade: 'Maid',        rating: 4.8, accent: 'bg-pink-100' },
  { name: 'Ramesh Yadav',   trade: 'Driver',      rating: 4.9, accent: 'bg-blue-100' },
  { name: 'Manoj Gupta',    trade: 'Painter',     rating: 4.7, accent: 'bg-fuchsia-100' },
  { name: 'Sunita Verma',   trade: 'Cook',        rating: 4.9, accent: 'bg-orange-100' },
  { name: 'Deepak Mishra',  trade: 'Welder',      rating: 4.8, accent: 'bg-slate-100' },
  { name: 'Pooja Singh',    trade: 'Beauty',      rating: 4.9, accent: 'bg-rose-100' },
  { name: 'Arjun Patel',    trade: 'Mobile Repair', rating: 4.8, accent: 'bg-lime-100' },
  { name: 'Kavita Joshi',   trade: 'Tutor',       rating: 5.0, accent: 'bg-purple-100' },
  { name: 'Mahesh Tiwari',  trade: 'Photographer', rating: 4.9, accent: 'bg-rose-100' },
  { name: 'Geeta Kumari',   trade: 'Mehndi Artist', rating: 4.8, accent: 'bg-pink-100' },
  { name: 'Vinod Saini',    trade: 'CCTV',        rating: 4.7, accent: 'bg-slate-100' },
  { name: 'Sandeep Kumar',  trade: 'Caterer',     rating: 4.9, accent: 'bg-amber-100' },
  { name: 'Renu Sharma',    trade: 'Dance Teacher', rating: 4.8, accent: 'bg-purple-100' },
  { name: 'Amit Choudhary', trade: 'Tempo Driver', rating: 4.7, accent: 'bg-cyan-100' },
  { name: 'Lakshmi Rao',    trade: 'Yoga Trainer', rating: 5.0, accent: 'bg-emerald-100' },
  { name: 'Naveen Reddy',   trade: 'DJ / Sound',  rating: 4.8, accent: 'bg-violet-100' },
  { name: 'Kiran Bedi',     trade: 'Bouncer',     rating: 4.9, accent: 'bg-indigo-100' },
  { name: 'Rohit Verma',    trade: 'Tile Worker', rating: 4.7, accent: 'bg-yellow-100' },
  { name: 'Anita Devi',     trade: 'Cleaner',     rating: 4.9, accent: 'bg-blue-100' },
  { name: 'Pradeep Yadav',  trade: 'Tent House',  rating: 4.8, accent: 'bg-orange-100' },
];

const TOP_WORKERS_VISIBLE = 7;

function shuffleAndPick(arr, n) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

// Fake testimonials. 6 entries shown 3 at a time via the carousel below.
const TESTIMONIALS = [
  { name: 'Anjali Verma', role: 'Client', city: 'Delhi',     rating: 5, quote: { hi: 'सिर्फ 30 मिनट में प्लंबर आ गया, बहुत अच्छा अनुभव!',                     en: 'Plumber arrived within 30 minutes — great experience!' } },
  { name: 'Mohit Singh',  role: 'Worker', city: 'Jaipur',    rating: 5, quote: { hi: 'पहले महीने में ही 12 जॉब्स मिलीं। ₹199 की सब्सक्रिप्शन वसूल हो गई।', en: 'Got 12 jobs in my first month. The ₹199 subscription paid for itself.' } },
  { name: 'Neha Sharma',  role: 'Client', city: 'Mumbai',    rating: 5, quote: { hi: 'घर के हर काम के लिए एक ही ऐप — कमाल का!',                                   en: 'One app for every home service — amazing!' } },
  { name: 'Suresh Kumar', role: 'Worker', city: 'Bengaluru', rating: 5, quote: { hi: 'KaamSetu ने मेरा बिजनेस बदल दिया। रोज नए क्लाइंट मिलते हैं।',         en: 'KaamSetu changed my business. New clients every day.' } },
  { name: 'Pooja Mishra', role: 'Client', city: 'Lucknow',   rating: 5, quote: { hi: 'वर्कर वेरिफाइड थे, बिल्कुल सेफ लगा।',                                       en: 'Workers are verified — felt completely safe.' } },
  { name: 'Rohit Verma',  role: 'Worker', city: 'Pune',      rating: 5, quote: { hi: 'अब हर महीने ₹40k+ कमा लेता हूँ। बहुत आभार!',                                en: 'I earn ₹40k+ every month now. Thank you!' } },
];

const TESTIMONIALS_PER_PAGE = 3;
const TESTIMONIAL_PAGES = Math.ceil(TESTIMONIALS.length / TESTIMONIALS_PER_PAGE);

export default function HomePage() {
  const router = useRouter();
  const { lang } = useLang();
  const t = useT();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [role, setRole] = useState(null);
  const [roles, setRoles] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [testimonialPage, setTestimonialPage] = useState(0);
  const [testimonialPaused, setTestimonialPaused] = useState(false);
  // Shuffle workers client-side after mount so SSR HTML matches the initial
  // server render; the random sample appears on the next paint.
  const [topWorkers, setTopWorkers] = useState(() => TOP_WORKERS_POOL.slice(0, TOP_WORKERS_VISIBLE));
  const suggestionsRef = useRef(null);

  useEffect(() => {
    setTopWorkers(shuffleAndPick(TOP_WORKERS_POOL, TOP_WORKERS_VISIBLE));
  }, []);

  // Auto-rotate the testimonials carousel every 6s; pause on hover.
  useEffect(() => {
    if (testimonialPaused || TESTIMONIAL_PAGES <= 1) return;
    const id = setInterval(() => {
      setTestimonialPage(p => (p + 1) % TESTIMONIAL_PAGES);
    }, 6000);
    return () => clearInterval(id);
  }, [testimonialPaused]);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('kaamsetu_user') || '{}');
      setRole(user.role || null);
      if (Array.isArray(user.roles)) setRoles(user.roles);
      else if (user.role) setRoles([user.role]);
    } catch { }
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 md:pt-10 pb-0 relative z-10">
          <div className="grid xl:grid-cols-2 gap-6 xl:min-h-[520px]">

            {/* left */}
            <div className="flex flex-col justify-center pb-4 xl:pb-20">
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
                className="bg-white rounded-2xl shadow-2xl p-2 md:p-2.5 mb-6 flex flex-col sm:flex-row gap-2">
                <select value={searchCategory} onChange={e => setSearchCategory(e.target.value)}
                  className="sm:w-48 px-3 py-2 md:py-2.5 rounded-xl border border-gray-100 text-gray-700 text-sm focus:outline-none focus:border-brand-navy bg-gray-50 font-hindi font-bold">
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
                    className="w-full px-4 py-2 md:py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-brand-navy font-hindi placeholder:text-gray-400"
                    autoComplete="off"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                      {suggestions.map((item, i) => (
                        <li
                          key={item.query}
                          onMouseDown={() => selectSuggestion(item)}
                          className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer text-sm transition-colors ${i === activeIdx ? 'bg-brand-navy text-white' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                          <Search size={13} className={i === activeIdx ? 'text-white/70' : 'text-gray-400'} />
                          <span className="font-hindi">{item.label}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex gap-2 md:gap-3">
                  <div className="relative">
                    <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={searchCity} onChange={e => setSearchCity(e.target.value)}
                      placeholder={t({ hi: 'आपका शहर', en: 'Your city' })}
                      className="w-32 md:w-40 pl-10 pr-3 py-2 md:py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-brand-navy font-hindi" />
                  </div>
                  <button type="submit"
                    className="bg-brand-yellow text-brand-navy font-black px-6 md:px-7 py-2 md:py-2.5 rounded-xl hover:bg-amber-400 transition-colors font-hindi text-sm whitespace-nowrap">
                    {t({ hi: 'खोजें', en: 'Search' })}
                  </button>
                </div>
              </form>

              {/* Quick action tiles. Each tile smart-routes via tileHref():
                  guests → role-specific signup page; logged-in users with
                  the role → their dashboard / action page. */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
                {ACTION_CARDS.map(card => (
                  <Link key={card.title.en} href={tileHref(card, role, roles)}
                    className="bg-white rounded-2xl p-3 flex flex-col items-center text-center hover:-translate-y-0.5 hover:shadow-lg transition-all border border-white/10">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${card.iconBg}`}>
                      <card.Icon size={20} className={card.iconColor} />
                    </div>
                    <p className="font-black text-brand-navy font-hindi text-sm leading-tight">{t(card.title)}</p>
                    <p className="text-gray-500 text-[10px] mt-0.5 leading-tight">{card.subtitle.en}</p>
                  </Link>
                ))}
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {[
                  { icon: Users, val: '1000+', label: { hi: 'वर्कर्स', en: 'Workers' } },
                  { icon: Briefcase, val: '500+', label: { hi: 'दैनिक जॉब्स', en: 'Daily Jobs' } },
                  { icon: Shield, val: '50+', label: { hi: 'कैटेगरी', en: 'Categories' } },
                  { icon: MapPin, val: '100+', label: { hi: 'शहरों में सेवा', en: 'Cities' } },
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

              <div className="flex flex-wrap gap-3 mt-4 xl:mt-6">
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

            {/* right — single static hero illustration. Bottom-aligned via
                flex so the workers stand on the hero's bottom edge, sized
                large enough to balance the left-column copy and shifted
                right so the right edge of the image lines up with the right
                edge of the hero panel. */}
            <div className="flex items-end justify-center xl:justify-end pt-2 xl:pt-0 xl:-mr-16 2xl:-mr-32">
              <img
                src={HERO_IMAGE}
                alt="KaamSetu workers"
                className="block w-full max-w-[420px] sm:max-w-[480px] md:max-w-[600px] lg:max-w-[680px] xl:max-w-[820px] 2xl:max-w-[900px] h-auto select-none pointer-events-none"
              />
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
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {SERVICE_TILES.map(tile => (
              <Link
                key={tile.en}
                href={tile.href}
                className={`${tile.bg} rounded-xl px-1.5 py-1.5 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-0.5 transition-all border border-transparent hover:border-gray-200`}
              >
                <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                  <Image src={tile.icon} alt={t(tile)} fill className="object-contain" sizes="96px" unoptimized />
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-brand-navy font-hindi leading-tight mt-0.5">{t(tile)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── ADVERTISEMENTS ───────────────────────────────────────── */}
      <section className="bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AdSlot variant="banner-wide" limit={9} heading={t({ hi: 'विज्ञापन', en: 'Advertisements' })} />
        </div>
      </section>

      {/* ── INTRO VIDEO ──────────────────────────────────────────── */}
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            {/* Left half — 4 step cards: how to upload an ad */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { icon: Store, title: { hi: 'शॉप रजिस्टर करें', en: 'Register Shop' }, desc: { hi: 'दुकान/बिज़नेस के तौर पर साइन अप करें', en: 'Sign up as a Shop / Business' }, card: 'bg-gradient-to-br from-blue-50 to-blue-100/60 border-blue-200', num: 'bg-brand-navy' },
                { icon: Megaphone, title: { hi: 'ऐड बनाएं', en: 'Create Ad' }, desc: { hi: 'कैटेगरी, फोटो और दिन चुनें', en: 'Pick category, image & days' }, card: 'bg-gradient-to-br from-purple-50 to-purple-100/60 border-purple-200', num: 'bg-purple-600' },
                { icon: CheckCircle, title: { hi: 'पेमेंट करें', en: 'Make Payment' }, desc: { hi: 'सिर्फ ₹100/दिन — UPI से', en: 'Just ₹100/day — via UPI' }, card: 'bg-gradient-to-br from-green-50 to-green-100/60 border-green-200', num: 'bg-green-600' },
                { icon: Zap, title: { hi: 'लाइव हो जाएं', en: 'Go Live' }, desc: { hi: 'Admin approval के बाद ऐड live', en: 'Live after admin approval' }, card: 'bg-gradient-to-br from-amber-50 to-amber-100/60 border-amber-200', num: 'bg-amber-500' },
              ].map((step, i) => (
                <div key={step.title.en} className={`relative rounded-2xl border-2 p-4 ${step.card}`}>
                  <span className={`absolute top-2.5 left-2.5 w-6 h-6 rounded-full ${step.num} text-white text-xs font-black flex items-center justify-center shadow-sm`}>
                    {i + 1}
                  </span>
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-2 ml-auto shadow-sm">
                    <step.icon size={18} className="text-brand-navy" />
                  </div>
                  <h3 className="font-black text-brand-navy text-sm font-hindi leading-tight">{t(step.title)}</h3>
                  <p className="text-gray-500 text-[11px] font-hindi leading-snug mt-0.5">{t(step.desc)}</p>
                </div>
              ))}
            </div>

            {/* Right half — grow-your-business pitch + upload-ad CTA */}
            <div className="flex flex-col justify-center">
              <h2 className="text-2xl md:text-3xl font-black text-brand-navy font-hindi mb-3">
                {t({ hi: 'अपने बिज़नेस को बढ़ाएं', en: 'Grow Your Business with Ads' })}
              </h2>
              <p className="text-gray-600 text-sm md:text-base mb-5 font-hindi leading-relaxed">
                {t({
                  hi: 'KaamSetu पर ऐड चलाएं और हज़ारों लोकल ग्राहकों तक पहुंचें। आपकी दुकान या सर्विस सबसे ऊपर दिखेगी — सिर्फ ₹100/दिन से।',
                  en: 'Run an ad on KaamSetu and reach thousands of local customers. Your shop or service shows up front and center — from just ₹100/day.',
                })}
              </p>
              <ul className="space-y-2.5 mb-6">
                {[
                  { hi: 'हज़ारों लोकल ग्राहकों तक पहुंच', en: 'Reach thousands of local customers' },
                  { hi: 'होम पेज और कैटेगरी पेज पर दिखें', en: 'Featured on home & category pages' },
                  { hi: 'सीधे call आपके नंबर पर', en: 'Customers call you directly' },
                ].map(item => (
                  <li key={item.en} className="flex items-center gap-2.5 text-sm text-brand-navy font-hindi">
                    <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
                    <span>{t(item)}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={role === 'shop' ? '/shop/ads' : '/auth/select-role'}
                className="inline-flex items-center justify-center gap-2 bg-brand-yellow text-brand-navy font-black px-6 py-3.5 rounded-xl hover:bg-amber-400 transition-colors font-hindi w-fit"
              >
                <Megaphone size={18} />
                {t({ hi: 'ऐड अपलोड करें', en: 'Upload an Ad' })}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── ACTION CARDS — 4 entry-points, all route through /auth/select-role
           which handles signed-in users (auto-routes) and guests (role picker). */}
      <section className="bg-brand-bg py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
            {ACTION_CARDS.map(card => (
              <div key={card.title.en}
                className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 flex flex-col items-center text-center shadow-sm card-hover border border-gray-100">
                <div className="relative mb-3 sm:mb-4 w-20 h-24 sm:w-32 sm:h-36 mx-auto">
                  <Image
                    src={card.illustration}
                    alt={t(card.title)}
                    fill
                    className="object-contain"
                    sizes="(max-width:640px) 80px, (max-width:1024px) 128px, 144px"
                  />
                </div>
                <h3 className="font-black text-brand-navy font-hindi text-sm sm:text-base mb-1">{t(card.title)}</h3>
                <p className="text-gray-500 text-[11px] sm:text-xs font-hindi mb-3 sm:mb-4 leading-snug">{t(card.desc)}</p>
                <Link href={tileHref(card, role, roles)}
                  className={`${card.btnColor} mt-auto w-full font-bold text-xs sm:text-sm py-2.5 sm:py-3 rounded-xl hover:opacity-90 transition-opacity font-hindi leading-none flex items-center justify-center`}>
                  {t(card.btn)}
                </Link>
              </div>
            ))}
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
              {
                icon: Search, step: '1',
                title: { hi: 'सेवा चुनें', en: 'Choose Service' },
                desc: { hi: 'अपनी जरूरत के अनुसार category और service चुनें', en: 'Choose a category and service according to your need' }
              },
              {
                icon: Briefcase, step: '2',
                title: { hi: 'Request भेजें', en: 'Send Request' },
                desc: { hi: 'अपना नाम, मोबाइल और काम की जानकारी भरें', en: 'Fill in your name, mobile, and work details' }
              },
              {
                icon: MessageCircle, step: '3',
                title: { hi: 'Worker से मिलें', en: 'Meet Your Worker' },
                desc: { hi: 'हम आपको verified worker से तुरंत connect करेंगे', en: "We'll instantly connect you with a verified worker" }
              },
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
              { icon: BadgeCheck, title: { hi: 'वेरिफाइड वर्कर', en: 'Verified Workers' }, iconBg: 'bg-white', color: 'text-brand-navy', card: 'bg-gradient-to-br from-blue-50 to-blue-100/60 border-blue-200', num: 'bg-brand-navy' },
              { icon: MessageCircle, title: { hi: 'सीधी बातचीत', en: 'Direct Contact' }, iconBg: 'bg-white', color: 'text-green-600', card: 'bg-gradient-to-br from-green-50 to-green-100/60 border-green-200', num: 'bg-green-600' },
              { icon: Shield, title: { hi: 'सुरक्षित और भरोसेमंद', en: 'Safe & Trusted' }, iconBg: 'bg-white', color: 'text-purple-600', card: 'bg-gradient-to-br from-purple-50 to-purple-100/60 border-purple-200', num: 'bg-purple-600' },
              { icon: Zap, title: { hi: 'तेज़ और आसान', en: 'Fast & Easy' }, iconBg: 'bg-white', color: 'text-amber-500', card: 'bg-gradient-to-br from-amber-50 to-amber-100/60 border-amber-200', num: 'bg-amber-500' },
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

      {/* ── TESTIMONIALS — 6 fake quotes, 3 at a time, 6s auto-advance ── */}
      <section className="bg-white py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-px w-16 bg-brand-navy/25" />
              <h2 className="text-2xl md:text-3xl font-black text-brand-navy font-hindi">
                {t({ hi: 'हमारे क्लाइंट्स और यूज़र्स क्या कहते हैं', en: 'What Our Clients & Users Say' })}
              </h2>
              <div className="h-px w-16 bg-brand-navy/25" />
            </div>
          </div>

          <div
            onMouseEnter={() => setTestimonialPaused(true)}
            onMouseLeave={() => setTestimonialPaused(false)}
          >
            <div key={testimonialPage} className="ad-fade grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TESTIMONIALS.slice(
                testimonialPage * TESTIMONIALS_PER_PAGE,
                testimonialPage * TESTIMONIALS_PER_PAGE + TESTIMONIALS_PER_PAGE
              ).map(tst => (
                <div key={tst.name} className="bg-gradient-to-br from-white to-brand-bg rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: tst.rating }).map((_, i) => (
                      <Star key={i} size={14} className="fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <p className="text-brand-navy text-sm font-hindi leading-relaxed mb-4">&quot;{t(tst.quote)}&quot;</p>
                  <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                    <div className="w-9 h-9 rounded-full bg-brand-navy text-white font-black flex items-center justify-center text-sm flex-shrink-0">
                      {tst.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-brand-navy text-sm leading-tight">{tst.name}</p>
                      <p className="text-xs text-gray-500">
                        <span className={tst.role === 'Worker' ? 'text-green-600 font-semibold' : 'text-brand-navy font-semibold'}>
                          {t({ hi: tst.role === 'Worker' ? 'वर्कर' : 'क्लाइंट', en: tst.role })}
                        </span>
                        {' • '}{tst.city}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Page dots */}
            {TESTIMONIAL_PAGES > 1 && (
              <div className="flex items-center justify-center gap-1 mt-6">
                {Array.from({ length: TESTIMONIAL_PAGES }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTestimonialPage(i)}
                    aria-label={`Show testimonials page ${i + 1}`}
                    className={`dot-indicator transition-all shrink-0 ${
                      i === testimonialPage ? 'w-3 bg-brand-navy' : 'w-1.5 bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── TOP-RATED WORKERS — fake leaderboard for social proof ─── */}
      <section className="bg-brand-bg py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-px w-16 bg-brand-navy/25" />
              <h2 className="text-2xl md:text-3xl font-black text-brand-navy font-hindi">
                {t({ hi: 'हमारे टॉप वर्कर्स', en: 'Our Top-Rated Workers' })}
              </h2>
              <div className="h-px w-16 bg-brand-navy/25" />
            </div>
            <p className="text-gray-500 text-sm font-hindi">
              {t({ hi: 'हज़ारों खुश क्लाइंट्स ने इन्हें चुना है', en: 'Thousands of happy clients chose them' })}
            </p>
          </div>
          {/* Continuous R→L marquee — duplicate the visible list so the
              animation can loop seamlessly. Pause on hover. */}
          <div className="marquee-mask group">
            <div className="marquee-track marquee-track--pill group-hover:[animation-play-state:paused]">
              {[...topWorkers, ...topWorkers].map((w, i) => (
                <div key={`${w.name}-${i}`} className="marquee-item--pill bg-white rounded-full pl-4 pr-2 py-2 shadow-sm border border-gray-100 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-brand-navy font-hindi leading-tight truncate">
                      {t({
                        hi: `${w.name} को मिली ${w.rating} रेटिंग`,
                        en: `${w.name} got ${w.rating} rating`,
                      })}
                    </p>
                    <p className="text-[10px] text-gray-400 leading-tight truncate">{w.trade}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-700 rounded-full px-2.5 py-1 flex-shrink-0">
                    <Star size={12} className="fill-amber-500 text-amber-500" />
                    <span className="font-black text-xs">{w.rating}</span>
                  </div>
                </div>
              ))}
            </div>
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
                  { hi: 'रोज नए काम पाएँ', en: 'Get new work every day' },
                  { hi: 'अपने प्रोफाइल से क्लाइंट पाएँ', en: 'Get clients from your profile' },
                  { hi: 'सीधे संपर्क करें', en: 'Direct contact with clients' },
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
              <video
                src="/illustrations/worker-hero-full.mp4"
                width={640}
                height={358}
                className="object-contain drop-shadow-xl w-full max-w-xl rounded-xl"
                autoPlay
                loop
                muted
                playsInline
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
