'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, UserCheck, Wrench } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useT } from '@/lib/i18n/useT';
import AddressAutocomplete from '@/components/AddressAutocomplete';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ClientSignupPage() {
  const router = useRouter();
  const toast = useToast();
  const t = useT();
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const submitRef = useRef(false);

  async function handleSignup(e) {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(mobile)) { toast.error(t({ hi: '10 अंकों का सही नंबर डालें', en: 'Enter valid 10-digit number' })); return; }
    if (!EMAIL_RE.test(email)) { toast.error(t({ hi: 'सही email डालें', en: 'Enter a valid email' })); return; }
    if (!name.trim()) { toast.error(t({ hi: 'नाम डालें', en: 'Enter name' })); return; }
    if (!location?.city && !location?.address) { toast.error(t({ hi: 'अपनी लोकेशन चुनें', en: 'Pick your location' })); return; }
    if (password.length < 6) { toast.error(t({ hi: 'पासवर्ड कम से कम 6 अक्षर का हो', en: 'Password must be at least 6 characters' })); return; }
    if (password !== confirmPassword) { toast.error(t({ hi: 'पासवर्ड मेल नहीं खाते', en: 'Passwords do not match' })); return; }
    if (submitRef.current) return;
    submitRef.current = true; setLoading(true);
    try {
      const res = await fetch('/api/auth/signup/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, email, name, location, password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || t({ hi: 'Signup विफल', en: 'Signup failed' })); return; }
      const token = data.token || data.data?.token;
      const user = data.user || data.data?.user || { mobile, name, email, role: 'client' };
      localStorage.setItem('kaamsetu_token', token);
      localStorage.setItem('kaamsetu_user', JSON.stringify(user));
      toast.success(t({ hi: 'Account बन गया!', en: 'Account created!' }));
      setTimeout(() => router.push('/client/dashboard'), 800);
    } catch {
      toast.error(t({ hi: 'कुछ गड़बड़ हुई', en: 'Something went wrong' }));
    } finally { setLoading(false); submitRef.current = false; }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left panel — desktop only */}
      <div className="hidden md:flex md:w-1/2 gradient-hero flex-col justify-center items-center px-12 text-center">
        <div className="w-20 h-20 bg-brand-yellow rounded-2xl flex items-center justify-center mb-6">
          <Wrench size={40} className="text-brand-navy" />
        </div>
        <h1 className="text-4xl font-black text-white font-hindi mb-3">KAR<span className="text-brand-yellow">VIA</span></h1>
        <p className="text-white/80 font-hindi text-lg mb-2">{t({ hi: 'काम करवाओ — आसानी से', en: 'Hire workers easily' })}</p>
        <p className="text-white/60 text-sm">{t({ hi: 'क्लाइंट के तौर पर जुड़ें', en: 'Join as a Client' })}</p>
        <div className="relative w-64 h-64 mt-6">
          <Image src="/illustrations/worker-hero.png" alt="" fill className="object-contain" sizes="256px" unoptimized />
        </div>
        <div className="mt-6 space-y-2 text-left max-w-xs">
          {[
            { hi: 'वेरिफाइड वर्कर्स', en: 'Verified workers' },
            { hi: 'सीधा संपर्क', en: 'Direct contact' },
            { hi: 'कोई कमीशन नहीं', en: 'No commission charged' },
          ].map(item => (
            <div key={item.en} className="flex items-center gap-2 text-white/80 text-sm font-hindi">
              <span className="text-brand-yellow">✓</span> {t(item)}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 bg-white flex flex-col">
        {/* Mobile top bar */}
        <div className="md:hidden bg-brand-navy px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-white/70 hover:text-white min-h-0">
            <ChevronLeft size={24} />
          </button>
          <span className="font-black text-white">KAR<span className="text-brand-yellow">VIA</span></span>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <div className="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-2xl mx-auto mb-5">
              <UserCheck size={28} className="text-brand-navy" />
            </div>
            <h2 className="text-2xl font-black text-brand-navy text-center font-hindi mb-1">
              {t({ hi: 'क्लाइंट साइन अप', en: 'Client Sign Up' })}
            </h2>
            <p className="text-gray-500 text-sm text-center mb-7 font-hindi">
              {t({ hi: 'काम करवाने के लिए रजिस्टर करें', en: 'Register to hire workers' })}
            </p>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">
                  {t({ hi: 'पूरा नाम *', en: 'Full Name *' })}
                </label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder={t({ hi: 'पूरा नाम', en: 'Full Name' })}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base" autoFocus />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">
                  {t({ hi: 'मोबाइल नंबर *', en: 'Mobile Number *' })}
                </label>
                <div className="flex gap-2">
                  <span className="flex items-center bg-gray-100 border border-gray-200 rounded-xl px-3 text-gray-600 text-sm">+91</span>
                  <input type="tel" inputMode="numeric" maxLength={10} value={mobile}
                    onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder={t({ hi: '10 अंकों का मोबाइल', en: '10-digit mobile' })}
                    className="flex-1 px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t({ hi: 'ईमेल पता *', en: 'Email Address *' })}</label>
                <input type="email" inputMode="email" value={email}
                  onChange={e => setEmail(e.target.value.trim())}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base" />
                <p className="text-xs text-gray-400 mt-1 font-hindi">
                  {t({ hi: 'सही email डालें — पासवर्ड भूलने पर इसी से reset होगा', en: 'Use a real email — needed for password reset' })}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">
                  {t({ hi: 'लोकेशन *', en: 'Location *' })}
                </label>
                <AddressAutocomplete value={location} onChange={setLocation} />
                <p className="text-xs text-gray-400 mt-1 font-hindi">
                  {t({ hi: 'अपनी कॉलोनी / सेक्टर / शहर डालें — या My Location से auto-fill करें', en: 'Type your area / sector / city — or use My Location' })}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">
                  {t({ hi: 'पासवर्ड *', en: 'Password *' })}
                </label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={t({ hi: 'कम से कम 6 अक्षर', en: 'Min 6 characters' })}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base"
                  autoComplete="new-password" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">
                  {t({ hi: 'पासवर्ड दोबारा *', en: 'Confirm Password *' })}
                </label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder={t({ hi: 'फिर से डालें', en: 'Re-enter password' })}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base"
                  autoComplete="new-password" />
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-brand-navy text-white font-bold py-4 rounded-xl hover:bg-brand-navy-dark disabled:opacity-50 font-hindi">
                {loading ? t({ hi: '⏳ बन रहा है...', en: '⏳ Creating...' }) : t({ hi: 'Account बनाएँ', en: 'Create Account' })}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              <span className="font-hindi">{t({ hi: 'पहले से account है?', en: 'Already have an account?' })} </span>
              <Link href="/auth/login" className="text-brand-navy font-bold hover:underline">{t({ hi: 'लॉगिन', en: 'Login' })}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
