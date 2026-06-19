'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Wrench, UserCheck, Store } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';

const DASHBOARD_BY_ROLE = {
  worker: '/worker/dashboard',
  client: '/client/dashboard',
  shop: '/shop/dashboard',
};

export default function SelectRolePage() {
  const t = useT();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('kaamsetu_user') || 'null');
      const roles = Array.isArray(u?.roles) ? u.roles : (u?.role ? [u.role] : []);
      // Logged in with exactly one role → no choice to make, go straight there.
      if (u && roles.length === 1 && DASHBOARD_BY_ROLE[roles[0]]) {
        router.replace(DASHBOARD_BY_ROLE[roles[0]]);
        return;
      }
      if (u && roles.length > 1) setUser({ ...u, roles });
    } catch {}
    setReady(true);
  }, [router]);

  function pickRole(role) {
    try {
      const u = JSON.parse(localStorage.getItem('kaamsetu_user') || '{}');
      localStorage.setItem('kaamsetu_user', JSON.stringify({ ...u, activeRole: role, role }));
    } catch {}
    router.push(DASHBOARD_BY_ROLE[role] || '/');
  }

  if (!ready) return null;

  // Logged-in multi-role user → show "Continue as" picker over their actual roles.
  if (user) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col">
        <div className="bg-brand-navy px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-white/70 hover:text-white min-h-0"><ChevronLeft size={24} /></Link>
          <span className="font-black text-white text-lg">KAAM<span className="text-brand-yellow">SETU</span></span>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md text-center">
            <h1 className="text-2xl font-black text-brand-navy font-hindi mb-2">
              {t({ hi: 'आप क्या करना चाहते हैं?', en: 'What would you like to do?' })}
            </h1>
            <p className="text-gray-500 mb-8">
              {t({ hi: 'अपना active role चुनें', en: 'Pick how you want to continue' })}
            </p>
            <div className="space-y-3">
              {user.roles.includes('client') && (
                <button onClick={() => pickRole('client')}
                  className="w-full bg-white border-2 border-brand-navy text-brand-navy rounded-2xl p-5 font-bold hover:bg-blue-50 transition-colors flex items-center gap-4">
                  <UserCheck size={28} className="text-brand-navy" />
                  <div className="text-left">
                    <p className="font-hindi text-lg">{t({ hi: 'सेवा लेनी है (Hire Worker)', en: 'Hire a Worker' })}</p>
                    <p className="text-xs text-gray-500 font-normal">{t({ hi: 'Client dashboard खोलें', en: 'Open client dashboard' })}</p>
                  </div>
                </button>
              )}
              {user.roles.includes('worker') && (
                <button onClick={() => pickRole('worker')}
                  className="w-full bg-brand-navy text-white rounded-2xl p-5 font-bold hover:bg-brand-navy-dark transition-colors flex items-center gap-4">
                  <Wrench size={28} className="text-brand-yellow" />
                  <div className="text-left">
                    <p className="font-hindi text-lg">{t({ hi: 'काम करना है (Find Work)', en: 'Find Work' })}</p>
                    <p className="text-xs text-white/60 font-normal">{t({ hi: 'Worker dashboard खोलें', en: 'Open worker dashboard' })}</p>
                  </div>
                </button>
              )}
              {user.roles.includes('shop') && (
                <button onClick={() => pickRole('shop')}
                  className="w-full bg-brand-yellow text-brand-navy rounded-2xl p-5 font-bold hover:bg-amber-400 transition-colors flex items-center gap-4">
                  <Store size={28} className="text-brand-navy" />
                  <div className="text-left">
                    <p className="font-hindi text-lg">{t({ hi: 'दुकान / Shop', en: 'Shop / Business' })}</p>
                    <p className="text-xs text-brand-navy/60 font-normal">{t({ hi: 'Shop dashboard खोलें', en: 'Open shop dashboard' })}</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      {/* Top bar */}
      <div className="bg-brand-navy px-4 py-4 flex items-center gap-3">
        <Link href="/" className="text-white/70 hover:text-white min-h-0">
          <ChevronLeft size={24} />
        </Link>
        <span className="font-black text-white text-lg">KAAM<span className="text-brand-yellow">SETU</span></span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-10">
            <h1 className="text-2xl md:text-3xl font-black text-brand-navy font-hindi mb-2">
              {t({ hi: 'आप क्या करना चाहते हैं?', en: 'What would you like to do?' })}
            </h1>
            <p className="text-gray-500">{t({ hi: 'एक विकल्प चुनें', en: 'Choose an option to continue' })}</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {/* Worker */}
            <Link href="/auth/signup/worker"
              className="bg-brand-navy text-white rounded-3xl p-8 flex flex-col items-center text-center card-hover border-2 border-transparent hover:border-brand-yellow transition-all">
              <div className="w-16 h-16 bg-brand-yellow rounded-2xl flex items-center justify-center mb-4">
                <Wrench size={32} className="text-brand-navy" />
              </div>
              <h2 className="text-xl font-black font-hindi mb-1">{t({ hi: 'काम ढूंढें', en: 'Find Work' })}</h2>
              <p className="text-sm text-white/60 mb-2">{t({ hi: 'वर्कर के रूप में जुड़ें', en: 'Join as a Worker' })}</p>
              <p className="text-white/80 text-sm font-hindi">{t({ hi: 'अपने हुनर का काम पाएँ', en: 'Get work matching your skills' })}</p>
            </Link>

            {/* Client */}
            <Link href="/auth/signup/client"
              className="bg-white text-brand-navy rounded-3xl p-8 flex flex-col items-center text-center card-hover border-2 border-brand-navy hover:border-brand-yellow transition-all">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                <UserCheck size={32} className="text-brand-navy" />
              </div>
              <h2 className="text-xl font-black font-hindi mb-1">{t({ hi: 'सेवा लें', en: 'Hire Worker' })}</h2>
              <p className="text-sm text-gray-400 mb-2">{t({ hi: 'क्लाइंट के रूप में जुड़ें', en: 'Join as a Client' })}</p>
              <p className="text-gray-600 text-sm font-hindi">{t({ hi: 'भरोसेमंद वर्कर से काम करवाएँ', en: 'Get work done by trusted workers' })}</p>
            </Link>

            {/* Shop */}
            <Link href="/auth/signup/shop"
              className="bg-brand-yellow text-brand-navy rounded-3xl p-8 flex flex-col items-center text-center card-hover border-2 border-transparent hover:border-brand-navy transition-all">
              <div className="w-16 h-16 bg-brand-navy/10 rounded-2xl flex items-center justify-center mb-4">
                <Store size={32} className="text-brand-navy" />
              </div>
              <h2 className="text-xl font-black font-hindi mb-1">{t({ hi: 'दुकान / Shop', en: 'Shop / Business' })}</h2>
              <p className="text-sm text-brand-navy/60 mb-2">{t({ hi: 'बिजनेस ओनर', en: 'Business Owner' })}</p>
              <p className="text-brand-navy/80 text-sm font-hindi">{t({ hi: 'अपनी दुकान का बढ़ावा दें', en: 'Promote your shop or business' })}</p>
            </Link>
          </div>

          <p className="text-center text-gray-500 text-sm mt-8">
            <span className="font-hindi">{t({ hi: 'पहले से account है?', en: 'Already have an account?' })} </span>
            <Link href="/auth/login" className="text-brand-navy font-bold hover:underline font-hindi">
              {t({ hi: 'Login करें', en: 'Login' })}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
