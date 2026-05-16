'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MapPin, Users, Briefcase, Shield, Search, MessageCircle, CheckCircle, BadgeCheck, Zap, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const SERVICE_TILES = [
  { icon: '/icons/mistri.png',       nameHi: 'मिस्त्री',            count: '200+', bg: 'bg-orange-50',  href: '/workers?q=mistri' },
  { icon: '/icons/plumber.png',      nameHi: 'प्लंबर',              count: '150+', bg: 'bg-blue-50',    href: '/workers?q=plumber' },
  { icon: '/icons/electrician.png',  nameHi: 'इलेक्ट्रीशियन',       count: '180+', bg: 'bg-yellow-50',  href: '/workers?q=electrician' },
  { icon: '/icons/painter.png',      nameHi: 'पेंटर',               count: '120+', bg: 'bg-pink-50',    href: '/workers?q=painter' },
  { icon: '/icons/carpenter.png',    nameHi: 'कारपेंटर',            count: '100+', bg: 'bg-amber-50',   href: '/workers?q=carpenter' },
  { icon: '/icons/driver.png',       nameHi: 'ड्राइवर',             count: '250+', bg: 'bg-cyan-50',    href: '/workers?category=vehicle-travel' },
  { icon: '/icons/caterer.png',      nameHi: 'कैटरर',               count: '80+',  bg: 'bg-green-50',   href: '/workers?q=caterer' },
  { icon: '/icons/dj.png',           nameHi: 'DJ',                  count: '60+',  bg: 'bg-purple-50',  href: '/workers?q=dj' },
  { icon: '/icons/dancer.png',       nameHi: 'डांसर',               count: '50+',  bg: 'bg-rose-50',    href: '/workers?q=dancer' },
  { icon: '/icons/singer.png',       nameHi: 'सिंगर',               count: '40+',  bg: 'bg-indigo-50',  href: '/workers?q=singer' },
  { icon: '/icons/tutor.png',        nameHi: 'ट्यूटर',              count: '90+',  bg: 'bg-teal-50',    href: '/workers?category=talent-training' },
  { icon: '/icons/caretaker.png',    nameHi: 'होम केयरटेकर',        count: '70+',  bg: 'bg-sky-50',     href: '/workers?category=home-care-living' },
  { icon: '/icons/security.png',     nameHi: 'सिक्योरिटी',          count: '60+',  bg: 'bg-slate-50',   href: '/workers?category=security-event-safety' },
  { icon: '/icons/logistics.png',    nameHi: 'होम लॉजिस्टिक',       count: '50+',  bg: 'bg-lime-50',    href: '/workers?category=packing-logistics' },
  { icon: '/icons/packing.png',      nameHi: 'पैकिंग सर्विस',       count: '40+',  bg: 'bg-orange-50',  href: '/workers?q=packing' },
  { icon: '/icons/more.png',         nameHi: 'और भी बहुत कुछ',      count: 'अन्य', bg: 'bg-gray-50',    href: '/categories' },
];

const ACTION_CARDS = [
  {
    illustration: '/illustrations/worker-hero.png',
    titleHi: 'वर्कर ढूंढें',
    descHi: 'अपने काम के लिए सही वर्कर ढूंढें',
    btnHi: 'अभी खोजें',
    btnColor: 'bg-brand-navy text-white',
    href: '/workers',
    imgW: 140, imgH: 160,
  },
  {
    illustration: '/illustrations/team-illustration.png',
    titleHi: 'टीम बनाएं',
    descHi: 'अपनी टीम बनाएं और ज्यादा काम पाएं',
    btnHi: 'टीम बनाएं',
    btnColor: 'bg-green-600 text-white',
    href: '/auth/select-role',
    imgW: 140, imgH: 160,
  },
  {
    illustration: '/illustrations/shop-illustration.png',
    titleHi: 'दुकान जोड़ें',
    descHi: 'अपनी दुकान रजिस्टर करें और ग्राहकों तक पहुंचाएं',
    btnHi: 'दुकान जोड़ें',
    btnColor: 'bg-orange-500 text-white',
    href: '/auth/signup/shop',
    imgW: 140, imgH: 160,
  },
  {
    illustration: '/illustrations/ads-illustration.png',
    titleHi: 'ऐड चलाएं',
    descHi: 'अपने बिजनेस, ऑफर या सर्विस का ऐड चलाएं',
    btnHi: 'ऐड चलाएं',
    btnColor: 'bg-purple-600 text-white',
    href: '/auth/select-role',
    imgW: 140, imgH: 160,
  },
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

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="gradient-hero overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-20">
          <div className="grid md:grid-cols-2 gap-10 items-end">

            {/* left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-5">
                <span className="text-brand-yellow text-xs">⭐</span>
                <span className="text-white/90 text-xs font-medium font-hindi">भारत का #1 लोकल सर्विस प्लेटफ़ॉर्म</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2 font-hindi leading-tight">
                हर काम, हर जगह
              </h1>
              <p className="text-2xl font-bold text-brand-yellow mb-4 font-hindi">
                सही वर्कर अब एक क्लिक पर!
              </p>
              <p className="text-white/70 mb-1 font-hindi text-sm">
                मिस्त्री, प्लंबर, कैटरर, डांसर, ट्यूटर — सभी सेवाएँ एक ही जगह
              </p>
              <p className="text-white/45 text-xs mb-8">
                Plumber, Caterer, Dancer, Tutor — All services in one place
              </p>

              {/* Search bar */}
              <form onSubmit={handleSearch}
                className="bg-white rounded-2xl shadow-2xl p-2.5 mb-7 flex flex-col sm:flex-row gap-2">
                <select value={searchCategory} onChange={e => setSearchCategory(e.target.value)}
                  className="sm:w-40 px-3 py-2.5 rounded-xl border border-gray-100 text-gray-600 text-sm focus:outline-none focus:border-brand-navy bg-gray-50 font-hindi">
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
                  { icon: Users,    val: '1000+', label: 'वर्कर्स' },
                  { icon: Briefcase, val: '500+', label: 'दैनिक जॉब्स' },
                  { icon: Shield,   val: '50+',   label: 'कैटेगरी' },
                  { icon: MapPin,   val: '100+',  label: 'शहरों में सेवा' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2">
                    <s.icon size={15} className="text-brand-yellow flex-shrink-0" />
                    <div>
                      <span className="text-white font-bold text-sm">{s.val} </span>
                      <span className="text-white/60 text-xs font-hindi">{s.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 mt-8">
                <Link href="/auth/select-role"
                  className="bg-brand-yellow text-brand-navy font-bold px-6 py-3 rounded-xl hover:bg-amber-400 transition-colors font-hindi">
                  काम करवाएँ / Hire Worker
                </Link>
                <Link href="/auth/select-role"
                  className="border-2 border-white text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors font-hindi">
                  काम ढूंढें / Find Work
                </Link>
              </div>
            </div>

            {/* right — hero illustration */}
            <div className="hidden md:flex items-end justify-center">
              <Image
                src="/illustrations/worker-hero.png"
                alt="KaamSetu verified worker"
                width={460}
                height={520}
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── POPULAR SERVICES ─────────────────────────────────────── */}
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-px w-16 bg-brand-navy/25" />
              <h2 className="text-2xl md:text-3xl font-black text-brand-navy font-hindi">लोकप्रिय सेवाएं</h2>
              <div className="h-px w-16 bg-brand-navy/25" />
            </div>
            <p className="text-gray-500 text-sm font-hindi">आपको जो भी काम चाहिए, हमारे पास सही वर्कर है</p>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
            {SERVICE_TILES.map(tile => (
              <Link key={tile.nameHi} href={tile.href}
                className={`${tile.bg} rounded-2xl p-3 flex flex-col items-center text-center card-hover border border-white hover:border-gray-200`}>
                <div className="w-12 h-12 relative mb-2">
                  <Image
                    src={tile.icon}
                    alt={tile.nameHi}
                    fill
                    className="object-contain"
                    sizes="48px"
                  />
                </div>
                <p className="text-brand-navy font-bold text-xs font-hindi leading-tight mb-0.5">{tile.nameHi}</p>
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

      {/* ── ACTION CARDS ─────────────────────────────────────────── */}
      <section className="bg-brand-bg py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {ACTION_CARDS.map(card => (
              <div key={card.titleHi}
                className="bg-white rounded-3xl p-5 flex flex-col items-center text-center shadow-sm card-hover border border-gray-100">
                <div className="relative mb-4" style={{ width: card.imgW, height: card.imgH }}>
                  <Image
                    src={card.illustration}
                    alt={card.titleHi}
                    fill
                    className="object-contain"
                    sizes="(max-width:768px) 140px, 160px"
                  />
                </div>
                <h3 className="font-black text-brand-navy font-hindi text-base mb-1">{card.titleHi}</h3>
                <p className="text-gray-500 text-xs font-hindi mb-4 leading-snug">{card.descHi}</p>
                <Link href={card.href}
                  className={`${card.btnColor} font-bold text-xs px-4 py-2 rounded-xl hover:opacity-90 transition-opacity font-hindi`}>
                  {card.btnHi}
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
            <h2 className="text-2xl md:text-3xl font-black text-white font-hindi mb-1">कैसे काम करता है?</h2>
            <p className="text-white/50 text-sm">How It Works — 3 simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Search,        step: '1', hi: 'सेवा चुनें',      en: 'Choose Service',  desc: 'अपनी जरूरत के अनुसार category और service चुनें' },
              { icon: Briefcase,     step: '2', hi: 'Request भेजें',   en: 'Send Request',    desc: 'अपना नाम, मोबाइल और काम की जानकारी भरें' },
              { icon: MessageCircle, step: '3', hi: 'Worker से मिलें', en: 'Meet Worker',     desc: 'हम आपको verified worker से तुरंत connect करेंगे' },
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
                <h3 className="text-white font-bold text-lg font-hindi mb-1">{s.hi}</h3>
                <p className="text-white/40 text-xs mb-2">{s.en}</p>
                <p className="text-white/70 text-sm font-hindi">{s.desc}</p>
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

      {/* ── WHY KAAMSETU ─────────────────────────────────────────── */}
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-brand-navy font-hindi mb-1">KaamSetu क्यों चुनें?</h2>
            <p className="text-gray-500 text-sm">Why KaamSetu?</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BadgeCheck,    hi: 'वेरिफाइड वर्कर',       en: 'Verified Workers', bg: 'bg-blue-50',   color: 'text-brand-navy' },
              { icon: MessageCircle, hi: 'सीधी बातचीत',          en: 'Direct Contact',   bg: 'bg-green-50',  color: 'text-green-600' },
              { icon: Shield,        hi: 'सुरक्षित और भरोसेमंद', en: 'Safe & Trusted',   bg: 'bg-purple-50', color: 'text-purple-600' },
              { icon: Zap,           hi: 'तेज़ और आसान',          en: 'Fast & Easy',      bg: 'bg-yellow-50', color: 'text-amber-500' },
            ].map(f => (
              <div key={f.en} className="text-center p-6 rounded-2xl border border-gray-100 card-hover">
                <div className={`w-14 h-14 ${f.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <f.icon size={26} className={f.color} />
                </div>
                <h3 className="font-bold text-brand-navy font-hindi mb-1">{f.hi}</h3>
                <p className="text-gray-400 text-sm">{f.en}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORKER CTA ───────────────────────────────────────────── */}
      <section className="py-14 px-4" style={{ background: 'linear-gradient(135deg,#F5A623 0%,#F59E0B 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-end">
            <div>
              <h2 className="text-3xl font-black text-brand-navy font-hindi mb-1">वर्कर बनें और कमाई शुरू करें</h2>
              <p className="text-brand-navy/60 text-sm mb-1">Become a Worker</p>
              <p className="text-brand-navy font-bold text-lg mb-5 font-hindi">सिर्फ ₹199 में पूरा महीना</p>
              <ul className="space-y-2 mb-6">
                {['रोज नए काम पाएँ', 'अपने प्रोफाइल से क्लाइंट पाएँ', 'सीधे संपर्क करें'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-brand-navy font-hindi text-sm">
                    <CheckCircle size={16} className="flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup/worker"
                className="inline-block bg-brand-navy text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-navy-dark transition-colors font-hindi">
                अभी रजिस्टर करें
              </Link>
            </div>
            <div className="hidden md:flex justify-center items-end">
              <Image
                src="/illustrations/worker-hero-full.png"
                alt="Become a KaamSetu worker"
                width={320}
                height={380}
                className="object-contain drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
