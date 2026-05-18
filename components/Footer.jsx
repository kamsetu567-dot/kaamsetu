'use client';
import Link from 'next/link';
import { Wrench } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';

export default function Footer() {
  const t = useT();
  return (
    <footer className="bg-brand-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-brand-yellow rounded-lg flex items-center justify-center">
                <Wrench size={16} className="text-brand-navy" />
              </div>
              <span className="font-black text-lg">KAAM<span className="text-brand-yellow">SETU</span></span>
            </div>
            <p className="text-white/60 text-sm font-hindi leading-relaxed">{t({ hi: 'हर काम, हर जगह', en: 'Every Work, Everywhere' })}</p>
            <p className="text-white/50 text-xs mt-1">{t({ hi: 'भारत का लोकल सर्विस मार्केटप्लेस', en: "India's local service marketplace" })}</p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold mb-4 text-brand-yellow text-sm font-hindi">{t({ hi: 'सेवाएँ', en: 'Services' })}</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              {['Plumber', 'Mistri', 'DJ', 'Caterer', 'Driver', 'Tutor'].map(s => (
                <li key={s}><Link href="/workers" className="hover:text-brand-yellow transition-colors">{s}</Link></li>
              ))}
            </ul>
          </div>

          {/* Workers */}
          <div>
            <h4 className="font-bold mb-4 text-brand-yellow text-sm font-hindi">{t({ hi: 'वर्कर के लिए', en: 'For Workers' })}</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li><Link href="/auth/signup/worker" className="hover:text-brand-yellow transition-colors">{t({ hi: 'रजिस्टर करें', en: 'Register' })}</Link></li>
              <li><Link href="/worker/dashboard"   className="hover:text-brand-yellow transition-colors">{t({ hi: 'डैशबोर्ड', en: 'Dashboard' })}</Link></li>
              <li><Link href="/worker/dashboard/subscription" className="hover:text-brand-yellow transition-colors">{t({ hi: 'सब्सक्रिप्शन', en: 'Subscription' })}</Link></li>
            </ul>
          </div>

          {/* Clients */}
          <div>
            <h4 className="font-bold mb-4 text-brand-yellow text-sm font-hindi">{t({ hi: 'क्लाइंट के लिए', en: 'For Clients' })}</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li><Link href="/workers"                   className="hover:text-brand-yellow transition-colors">{t({ hi: 'वर्कर ढूंढें',  en: 'Find Worker' })}</Link></li>
              <li><Link href="/client/request-service"    className="hover:text-brand-yellow transition-colors">{t({ hi: 'Request भेजें', en: 'Post Request' })}</Link></li>
              <li><Link href="/#how-it-works"             className="hover:text-brand-yellow transition-colors">{t({ hi: 'कैसे काम करता है', en: 'How it Works' })}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-white/50 text-xs">
          <p>© 2025 KaamSetu. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy"    className="hover:text-brand-yellow transition-colors">Privacy Policy</Link>
            <Link href="/terms"      className="hover:text-brand-yellow transition-colors">Terms</Link>
            <Link href="/disclaimer" className="hover:text-brand-yellow transition-colors">Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
