import Link from 'next/link';
import { Wrench } from 'lucide-react';

export default function Footer() {
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
            <p className="text-white/60 text-sm font-hindi leading-relaxed">हर काम, हर जगह</p>
            <p className="text-white/50 text-xs mt-1">India's local service marketplace</p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold mb-4 text-brand-yellow text-sm font-hindi">सेवाएँ</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              {['Plumber', 'Mistri', 'DJ', 'Caterer', 'Driver', 'Tutor'].map(s => (
                <li key={s}><Link href="/workers" className="hover:text-brand-yellow transition-colors">{s}</Link></li>
              ))}
            </ul>
          </div>

          {/* Workers */}
          <div>
            <h4 className="font-bold mb-4 text-brand-yellow text-sm font-hindi">वर्कर के लिए</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li><Link href="/auth/signup/worker" className="hover:text-brand-yellow transition-colors">Register</Link></li>
              <li><Link href="/worker/dashboard" className="hover:text-brand-yellow transition-colors">Dashboard</Link></li>
              <li><Link href="/worker/dashboard/subscription" className="hover:text-brand-yellow transition-colors">Subscription</Link></li>
            </ul>
          </div>

          {/* Clients */}
          <div>
            <h4 className="font-bold mb-4 text-brand-yellow text-sm font-hindi">क्लाइंट के लिए</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li><Link href="/workers" className="hover:text-brand-yellow transition-colors">Find Worker</Link></li>
              <li><Link href="/client/request-service" className="hover:text-brand-yellow transition-colors">Post Request</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-brand-yellow transition-colors">How it Works</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-white/50 text-xs">
          <p>© 2025 KaamSetu. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-brand-yellow transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-brand-yellow transition-colors">Terms</Link>
            <Link href="/disclaimer" className="hover:text-brand-yellow transition-colors">Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
