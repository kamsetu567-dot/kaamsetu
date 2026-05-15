'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Hammer, Home, PartyPopper, GraduationCap, Sparkles, Car, Store, Settings, Heart, Shield, Package, Search, MapPin, Users, Briefcase, CheckCircle, MessageCircle, Zap, BadgeCheck, ArrowRight, Wrench } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CATEGORIES } from '@/lib/data/categories';

const ICON_MAP = { Hammer, Home, PartyPopper, GraduationCap, Sparkles, Car, Store, Settings, Heart, Shield, Package };

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

      {/* HERO */}
      <section className="gradient-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
                <span className="text-brand-yellow text-xs">⭐</span>
                <span className="text-white/90 text-xs font-medium font-hindi">भारत का #1 लोकल सर्विस प्लेटफ़ॉर्म</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2 font-hindi leading-tight">
                हर काम, हर जगह
              </h1>
              <p className="text-2xl font-bold text-brand-yellow mb-4 font-hindi">
                सही वर्कर अब एक क्लिक पर!
              </p>
              <p className="text-white/70 mb-1 font-hindi">
                मिस्त्री, प्लंबर, केटरर, डांसर, ट्यूटर — सभी सेवाएँ एक ही जगह
              </p>
              <p className="text-white/50 text-sm mb-8">
                Plumber, Caterer, Dancer, Tutor — All services in one place
              </p>

              {/* Search */}
              <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-3 mb-8">
                <div className="flex flex-col sm:flex-row gap-2">
                  <select value={searchCategory} onChange={e => setSearchCategory(e.target.value)}
                    className="sm:w-40 px-3 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm focus:outline-none focus:border-brand-navy bg-white">
                    <option value="">All Categories</option>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.nameHi}</option>)}
                  </select>
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="आपको क्या चाहिए? (जैसे — Plumber)"
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-navy font-hindi" />
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" value={searchCity} onChange={e => setSearchCity(e.target.value)}
                        placeholder="City"
                        className="w-full pl-8 pr-3 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-navy" />
                    </div>
                    <button type="submit"
                      className="bg-brand-yellow text-brand-navy font-bold px-5 py-3 rounded-xl hover:bg-amber-400 transition-colors whitespace-nowrap font-hindi min-h-0">
                      खोजें
                    </button>
                  </div>
                </div>
              </form>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Users, val: '1000+', label: 'वर्कर्स' },
                  { icon: Briefcase, val: '500+', label: 'दैनिक जॉब्स' },
                  { icon: Shield, val: '50+', label: 'कैटेगरी' },
                  { icon: MapPin, val: '100+', label: 'शहरों में सेवा' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2">
                    <s.icon size={16} className="text-brand-yellow flex-shrink-0" />
                    <div>
                      <p className="text-white font-bold text-sm">{s.val}</p>
                      <p className="text-white/60 text-xs font-hindi">{s.label}</p>
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

            <div className="hidden md:flex items-center justify-center">
              <div className="w-72 h-72 rounded-full bg-white/10 border-4 border-white/20 flex items-center justify-center">
                <div className="w-52 h-52 rounded-full bg-white/10 border-4 border-brand-yellow/30 flex items-center justify-center">
                  <Wrench size={80} className="text-brand-yellow" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="bg-brand-bg py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-brand-navy font-hindi mb-1">लोकप्रिय सेवाएँ</h2>
            <p className="text-gray-500 text-sm">Popular Services</p>
            <p className="text-gray-500 text-sm mt-1 font-hindi">आपको जो भी काम चाहिए, हमारे पास सही वर्कर है</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES.map(cat => {
              const Icon = ICON_MAP[cat.icon] || Hammer;
              return (
                <Link key={cat.id} href={`/workers?category=${cat.id}`}
                  className="bg-white rounded-2xl p-5 shadow-sm card-hover border border-gray-100 group block">
                  <div className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center mb-3`}>
                    <Icon size={22} />
                  </div>
                  <p className="font-bold text-brand-navy text-sm font-hindi mb-0.5">{cat.nameHi}</p>
                  <p className="text-gray-400 text-xs mb-2">{cat.nameEn}</p>
                  <p className="text-gray-500 text-xs font-hindi">200+ वर्कर</p>
                  <ArrowRight size={14} className="text-brand-navy mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              );
            })}
          </div>
          <div className="text-center mt-8">
            <Link href="/categories"
              className="inline-flex items-center gap-2 bg-brand-navy text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-navy-dark transition-colors font-hindi">
              सभी सेवाएँ देखें / View All <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-brand-navy py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white font-hindi mb-1">कैसे काम करता है?</h2>
            <p className="text-white/60 text-sm">How It Works</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Search, step: '1', hi: 'सेवा चुनें', en: 'Choose Service', desc: 'अपनी जरूरत के अनुसार category और service चुनें' },
              { icon: Briefcase, step: '2', hi: 'Request भेजें', en: 'Send Request', desc: 'अपना नाम, मोबाइल और काम की जानकारी भरें' },
              { icon: MessageCircle, step: '3', hi: 'Worker से मिलें', en: 'Meet Worker', desc: 'हम आपको verified worker से तुरंत connect करेंगे' },
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
                <p className="text-white/50 text-xs mb-2">{s.en}</p>
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

      {/* WHY KAAMSETU */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-brand-navy font-hindi mb-1">KaamSetu क्यों चुनें?</h2>
            <p className="text-gray-500 text-sm">Why KaamSetu?</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BadgeCheck, hi: 'वेरिफाइड वर्कर', en: 'Verified Workers', bg: 'bg-blue-50', color: 'text-brand-navy' },
              { icon: MessageCircle, hi: 'सीधी बातचीत', en: 'Direct Contact', bg: 'bg-green-50', color: 'text-green-600' },
              { icon: Shield, hi: 'सुरक्षित और भरोसेमंद', en: 'Safe & Trusted', bg: 'bg-purple-50', color: 'text-purple-600' },
              { icon: Zap, hi: 'तेज़ और आसान', en: 'Fast & Easy', bg: 'bg-yellow-50', color: 'text-brand-yellow' },
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

      {/* WORKER CTA */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(135deg,#F5A623 0%,#F59E0B 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl font-black text-brand-navy font-hindi mb-1">वर्कर बनें और कमाई शुरू करें</h2>
              <p className="text-brand-navy/70 text-sm mb-1">Become a Worker</p>
              <p className="text-brand-navy font-bold text-lg mb-5">सिर्फ ₹199 में पूरा महीना / Only ₹199/month</p>
              <ul className="space-y-2 mb-6">
                {['रोज नए काम पाएँ', 'अपने प्रोफाइल से क्लाइंट पाएँ', 'सीधे संपर्क करें'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-brand-navy font-hindi text-sm">
                    <CheckCircle size={16} className="text-brand-navy flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth/select-role"
                className="inline-block bg-brand-navy text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-navy-dark transition-colors font-hindi">
                अभी Register करें
              </Link>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="w-48 h-48 rounded-full bg-brand-navy/10 flex items-center justify-center">
                <Wrench size={64} className="text-brand-navy" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
