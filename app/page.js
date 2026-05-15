'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Users, Briefcase, Shield, Search, MessageCircle, Zap, BadgeCheck, ArrowRight, CheckCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const SERVICE_TILES = [
  { emoji: '🔨', nameHi: 'मिस्त्री',          count: '200+', color: 'bg-orange-50',  border: 'border-orange-200', href: '/workers?q=mistri' },
  { emoji: '🔧', nameHi: 'प्लंबर',            count: '150+', color: 'bg-blue-50',    border: 'border-blue-200',   href: '/workers?q=plumber' },
  { emoji: '⚡', nameHi: 'इलेक्ट्रीशियन',     count: '180+', color: 'bg-yellow-50',  border: 'border-yellow-200', href: '/workers?q=electrician' },
  { emoji: '🎨', nameHi: 'पेंटर',             count: '120+', color: 'bg-pink-50',    border: 'border-pink-200',   href: '/workers?q=painter' },
  { emoji: '🪚', nameHi: 'कारपेंटर',          count: '100+', color: 'bg-amber-50',   border: 'border-amber-200',  href: '/workers?q=carpenter' },
  { emoji: '🚗', nameHi: 'ड्राइवर',           count: '250+', color: 'bg-cyan-50',    border: 'border-cyan-200',   href: '/workers?category=vehicle-travel' },
  { emoji: '🍽️', nameHi: 'कैटरर',             count: '80+',  color: 'bg-green-50',   border: 'border-green-200',  href: '/workers?q=caterer' },
  { emoji: '🎧', nameHi: 'DJ',                count: '60+',  color: 'bg-purple-50',  border: 'border-purple-200', href: '/workers?q=dj' },
  { emoji: '💃', nameHi: 'डांसर',             count: '50+',  color: 'bg-rose-50',    border: 'border-rose-200',   href: '/workers?q=dancer' },
  { emoji: '🎤', nameHi: 'सिंगर',             count: '40+',  color: 'bg-indigo-50',  border: 'border-indigo-200', href: '/workers?q=singer' },
  { emoji: '📚', nameHi: 'ट्यूटर',            count: '90+',  color: 'bg-teal-50',    border: 'border-teal-200',   href: '/workers?category=talent-training' },
  { emoji: '🏠', nameHi: 'होम केयरटेकर',      count: '70+',  color: 'bg-sky-50',     border: 'border-sky-200',    href: '/workers?category=home-care-living' },
  { emoji: '🛡️', nameHi: 'बाउंसर (मेल/फीमेल)', count: '60+', color: 'bg-slate-50',  border: 'border-slate-200',  href: '/workers?category=security-event-safety' },
  { emoji: '🚚', nameHi: 'होम लॉजिस्टिक',     count: '50+',  color: 'bg-lime-50',    border: 'border-lime-200',   href: '/workers?category=packing-logistics' },
  { emoji: '📦', nameHi: 'पैकिंग सर्विस',     count: '40+',  color: 'bg-orange-50',  border: 'border-orange-100', href: '/workers?q=packing' },
  { emoji: '✨', nameHi: 'और भी बहुत कुछ',    count: 'अन्य कैटेगरी', color: 'bg-gray-50', border: 'border-gray-200', href: '/categories' },
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchCategory, setSearchCategory] = useState('');

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (searchCity) params.set('city', searchCity);
    if (searchCategory) params.set('category', searchCategory);
    router.push(`/workers?${params.toString()}`);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="gradient-hero overflow-hidden relative">
        {/* decorative dots */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white/5"
              style={{ width: `${8 + (i % 4) * 4}px`, height: `${8 + (i % 4) * 4}px`, top: `${(i * 17) % 90}%`, left: `${(i * 13 + 5) % 95}%` }} />
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-20 relative">
          <div className="grid md:grid-cols-2 gap-10 items-center">

            {/* Left — text + search */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 mb-5">
                <span className="text-brand-yellow text-xs">⭐</span>
                <span className="text-white/90 text-xs font-medium font-hindi">भारत का #1 लोकल सर्विस प्लेटफ़ॉर्म</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-white mb-1 font-hindi leading-tight">
                हर काम, हर जगह
              </h1>
              <h2 className="text-2xl md:text-3xl font-black text-brand-yellow mb-4 font-hindi">
                सही वर्कर अब एक क्लिक पर!
              </h2>
              <p className="text-white/75 mb-1 font-hindi text-sm">
                मिस्त्री, प्लंबर, कैटरर, डांसर, ट्यूटर — सभी सेवाएँ एक ही जगह
              </p>
              <p className="text-white/45 text-xs mb-8">
                Plumber, Caterer, Dancer, Tutor — All services in one place
              </p>

              {/* Search */}
              <form onSubmit={handleSearch}
                className="bg-white rounded-2xl shadow-2xl p-2.5 mb-7 flex flex-col sm:flex-row gap-2">
                <select value={searchCategory} onChange={e => setSearchCategory(e.target.value)}
                  className="sm:w-36 px-3 py-2.5 rounded-xl border border-gray-100 text-gray-600 text-sm focus:outline-none focus:border-brand-navy bg-gray-50 font-hindi">
                  <option value="">सभी कैटेगरी</option>
                  <option value="construction-repair">मिस्त्री / प्लंबर</option>
                  <option value="event-services">इवेंट सेवाएँ</option>
                  <option value="home-services">घरेलू सेवाएँ</option>
                  <option value="talent-training">ट्यूटर / ट्रेनर</option>
                  <option value="vehicle-travel">ड्राइवर / वाहन</option>
                  <option value="beauty-personal-care">ब्यूटी सर्विस</option>
                  <option value="repair-technical">रिपेयर सेवाएँ</option>
                </select>

                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="आपको क्या चाहिए? (जैसे — Plumber, Painter)"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-brand-navy font-hindi" />

                <div className="flex gap-2">
                  <div className="relative">
                    <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={searchCity} onChange={e => setSearchCity(e.target.value)}
                      placeholder="आपका शहर"
                      className="w-28 pl-8 pr-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-brand-navy font-hindi" />
                  </div>
                  <button type="submit"
                    className="bg-brand-yellow text-brand-navy font-bold px-5 py-2.5 rounded-xl hover:bg-amber-400 transition-colors font-hindi text-sm whitespace-nowrap">
                    खोजें
                  </button>
                </div>
              </form>

              {/* Stats */}
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {[
                  { icon: '👷', val: '1000+', label: 'वर्कर्स' },
                  { icon: '💼', val: '500+',  label: 'दैनिक जॉब्स' },
                  { icon: '🏷️', val: '50+',   label: 'कैटेगरी' },
                  { icon: '📍', val: '100+',  label: 'शहरों में सेवा' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className="text-base">{s.icon}</span>
                    <div>
                      <span className="text-white font-bold text-sm">{s.val} </span>
                      <span className="text-white/60 text-xs font-hindi">{s.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — worker illustration */}
            <div className="hidden md:flex items-end justify-center relative">
              {/* glowing circle backdrop */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(245,166,35,0.25) 0%, transparent 70%)' }} />

              {/* main illustration card */}
              <div className="relative z-10 flex flex-col items-center">
                {/* worker avatar */}
                <div className="w-56 h-64 rounded-3xl flex flex-col items-center justify-end pb-4 relative overflow-hidden"
                  style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)', border: '1.5px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)' }}>
                  {/* hard hat */}
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 text-7xl leading-none select-none">👷</div>
                  {/* tool belt row */}
                  <div className="flex gap-3 text-2xl mt-24 select-none">🔧🔨⚡</div>
                  {/* name tag */}
                  <div className="mt-3 bg-brand-yellow/90 text-brand-navy text-xs font-bold px-4 py-1.5 rounded-full font-hindi">
                    वेरिफाइड वर्कर ✓
                  </div>
                </div>

                {/* floating badges */}
                <div className="absolute -top-3 -right-4 bg-white rounded-2xl shadow-lg px-3 py-2 text-xs font-bold text-green-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
                  <span>Available Now</span>
                </div>
                <div className="absolute bottom-20 -left-6 bg-white rounded-2xl shadow-lg px-3 py-2 text-xs font-bold text-brand-navy flex items-center gap-1.5">
                  ⭐ <span>4.9 Rating</span>
                </div>
                <div className="absolute top-20 -left-5 bg-brand-yellow rounded-xl shadow-lg px-3 py-1.5 text-xs font-bold text-brand-navy">
                  🏆 Top Rated
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── POPULAR SERVICES ─────────────────────────────────────── */}
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* section header with decorative lines */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-px w-16 bg-brand-navy/30" />
              <h2 className="text-2xl md:text-3xl font-black text-brand-navy font-hindi">लोकप्रिय सेवाएं</h2>
              <div className="h-px w-16 bg-brand-navy/30" />
            </div>
            <p className="text-gray-500 text-sm font-hindi">आपको जो भी काम चाहिए, हमारे पास सही वर्कर है</p>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
            {SERVICE_TILES.map(tile => (
              <Link key={tile.nameHi} href={tile.href}
                className={`${tile.color} ${tile.border} border rounded-2xl p-3 flex flex-col items-center text-center card-hover`}>
                <span className="text-3xl mb-2 leading-none">{tile.emoji}</span>
                <p className="text-brand-navy font-bold text-xs font-hindi leading-tight mb-1">{tile.nameHi}</p>
                <p className="text-gray-400 text-[10px] font-hindi">{tile.count} वर्कर</p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/categories"
              className="inline-flex items-center gap-2 bg-brand-navy text-white font-bold px-6 py-2.5 rounded-xl hover:bg-brand-navy-dark transition-colors font-hindi text-sm">
              सभी सेवाएँ देखें <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── WHY KAAMSETU ─────────────────────────────────────────── */}
      <section className="bg-brand-bg py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* left card: Why choose */}
            <div className="bg-brand-navy rounded-3xl p-8 text-white">
              <h3 className="text-2xl font-black font-hindi mb-6">KaamSetu क्यों चुनें?</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: '✅', hi: 'वेरिफाइड वर्कर', sub: 'सभी वर्कर वेरिफाइड हैं' },
                  { icon: '💬', hi: 'सीधी बातचीत',   sub: 'वर्कर से सीधा संपर्क करें' },
                  { icon: '🔒', hi: 'सुरक्षित और भरोसेमंद', sub: 'आपकी सुरक्षा हमारी प्राथमिकता' },
                  { icon: '⚡', hi: 'तेज़ और आसान',   sub: 'कुछ ही क्लिक में बुक करें' },
                ].map(f => (
                  <div key={f.hi} className="flex gap-3 items-start">
                    <span className="text-xl mt-0.5 flex-shrink-0">{f.icon}</span>
                    <div>
                      <p className="font-bold text-sm font-hindi">{f.hi}</p>
                      <p className="text-white/55 text-xs font-hindi">{f.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* right card: Worker CTA */}
            <div className="rounded-3xl p-8 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #F5A623 0%, #F59E0B 100%)' }}>
              {/* decorative worker silhouette */}
              <div className="absolute right-4 bottom-0 text-8xl opacity-20 select-none">👷</div>

              <div className="relative z-10">
                <p className="text-brand-navy/70 text-sm font-hindi mb-1">Become a Worker</p>
                <h3 className="text-2xl font-black text-brand-navy font-hindi mb-1">
                  वर्कर बनें और कमाई शुरू करें
                </h3>
                <p className="text-brand-navy font-bold text-lg mb-4 font-hindi">
                  सिर्फ ₹199 में पूरा महीना
                </p>
                <ul className="space-y-2 mb-6">
                  {['रोज नए काम पाएं', 'अपने प्रोफाइल से क्लाइंट पाएं'].map(item => (
                    <li key={item} className="flex items-center gap-2 text-brand-navy font-hindi text-sm">
                      <CheckCircle size={15} className="flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup/worker"
                  className="inline-block bg-brand-navy text-white font-bold px-6 py-2.5 rounded-xl hover:bg-brand-navy-dark transition-colors font-hindi text-sm">
                  अभी रजिस्टर करें
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-brand-navy py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-white font-hindi mb-1">कैसे काम करता है?</h2>
            <p className="text-white/50 text-sm">How It Works — 3 simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { emoji: '🔍', step: '1', hi: 'सेवा चुनें',     en: 'Choose Service',  desc: 'अपनी जरूरत के अनुसार category और service चुनें' },
              { emoji: '📝', step: '2', hi: 'Request भेजें',  en: 'Send Request',    desc: 'अपना नाम, मोबाइल और काम की जानकारी भरें' },
              { emoji: '🤝', step: '3', hi: 'Worker से मिलें', en: 'Meet Worker',    desc: 'हम आपको verified worker से तुरंत connect करेंगे' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-16 h-16 bg-brand-yellow rounded-2xl flex items-center justify-center text-3xl">
                    {s.emoji}
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-brand-navy font-black text-sm">
                    {s.step}
                  </span>
                </div>
                <h3 className="text-white font-bold text-lg font-hindi mb-0.5">{s.hi}</h3>
                <p className="text-white/40 text-xs mb-2">{s.en}</p>
                <p className="text-white/65 text-sm font-hindi">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/auth/select-role"
              className="bg-brand-yellow text-brand-navy font-bold px-8 py-3 rounded-xl hover:bg-amber-400 transition-colors font-hindi">
              अभी शुरू करें / Get Started
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
