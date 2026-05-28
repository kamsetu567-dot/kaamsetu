'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, UserCheck, MapPin, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/Toast';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ClientSignupPage() {
  const router = useRouter();
  const toast = useToast();
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [locating, setLocating] = useState(false);
  const submitRef = useRef(false);

  const located = lat != null && lng != null;

  // Explicit, high-accuracy location capture on button tap. maximumAge:0 forces a
  // fresh fix so we don't save a stale/coarse cached position — accurate "nearby"
  // distance depends on this being precise.
  function detectLocation() {
    if (locating) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.error('आपका browser location support नहीं करता / Browser does not support location');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocating(false);
        toast.success('लोकेशन मिल गई! / Location added — nearby workers will be accurate');
      },
      (err) => {
        setLocating(false);
        const msg = err.code === 1
          ? 'Location permission denied / Browser में location allow करें'
          : err.code === 3
          ? 'Location request timed out / दोबारा try करें'
          : 'लोकेशन नहीं मिली / Could not get your location';
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function handleSignup(e) {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(mobile)) { toast.error('10 अंकों का सही नंबर डालें / Enter valid 10-digit number'); return; }
    if (!EMAIL_RE.test(email)) { toast.error('सही email डालें / Enter a valid email'); return; }
    if (!name.trim()) { toast.error('नाम डालें / Enter name'); return; }
    if (!city.trim()) { toast.error('शहर डालें / Enter city'); return; }
    if (!area.trim()) { toast.error('एरिया डालें / Enter area'); return; }
    if (password.length < 6) { toast.error('पासवर्ड कम से कम 6 अक्षर का हो / Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { toast.error('पासवर्ड मेल नहीं खाते / Passwords do not match'); return; }
    if (submitRef.current) return;
    submitRef.current = true; setLoading(true);
    try {
      const res = await fetch('/api/auth/signup/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, email, name, city, area, password, ...(lat && lng ? { lat, lng } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || 'Signup failed'); return; }
      const token = data.token || data.data?.token;
      const user = data.user || data.data?.user || { mobile, name, email, role: 'client' };
      localStorage.setItem('kaamsetu_token', token);
      localStorage.setItem('kaamsetu_user', JSON.stringify(user));
      toast.success('Account बन गया! / Account created!');
      setTimeout(() => router.push('/client/dashboard'), 800);
    } catch {
      toast.error('कुछ गड़बड़ हुई / Something went wrong');
    } finally { setLoading(false); submitRef.current = false; }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <div className="bg-brand-navy px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.push('/auth/select-role')}
          className="text-white/70 hover:text-white min-h-0"><ChevronLeft size={24} /></button>
        <span className="font-black text-white">KAAM<span className="text-brand-yellow">SETU</span></span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-2xl mx-auto mb-5">
            <UserCheck size={28} className="text-brand-navy" />
          </div>
          <h1 className="text-xl font-black text-brand-navy text-center font-hindi mb-1">Client Sign Up</h1>
          <p className="text-gray-400 text-sm text-center mb-6">काम करवाने के लिए register करें</p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">पूरा नाम * / Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base" autoFocus />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">मोबाइल नंबर *</label>
              <div className="flex gap-2">
                <span className="flex items-center bg-gray-100 border border-gray-200 rounded-xl px-3 text-gray-600 text-sm">+91</span>
                <input type="tel" inputMode="numeric" maxLength={10} value={mobile}
                  onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile"
                  className="flex-1 px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address *</label>
              <input type="email" inputMode="email" value={email}
                onChange={e => setEmail(e.target.value.trim())}
                placeholder="your@email.com"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base" />
              <p className="text-xs text-gray-400 mt-1 font-hindi">सही email डालें — पासवर्ड भूलने पर इसी से reset होगा / Use a real email — needed to reset a forgotten password</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">शहर * / City</label>
              <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="City"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">एरिया / Mohalla *</label>
              <input type="text" value={area} onChange={e => setArea(e.target.value)} placeholder="Area / Mohalla"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base" />
            </div>

            <div>
              <button type="button" onClick={detectLocation} disabled={locating}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border font-semibold text-sm transition-colors disabled:opacity-60 ${
                  located
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-white border-gray-200 text-brand-navy hover:border-brand-navy'
                }`}>
                {locating ? (
                  <><Loader2 size={16} className="animate-spin" /> <span className="font-hindi">लोकेशन ले रहे हैं... / Getting location...</span></>
                ) : located ? (
                  <><CheckCircle size={16} /> <span className="font-hindi">लोकेशन मिल गई — दोबारा लेने के लिए tap करें / Location added (tap to refresh)</span></>
                ) : (
                  <><MapPin size={16} /> <span className="font-hindi">मेरी लोकेशन / Use My Location</span></>
                )}
              </button>
              <p className="text-xs text-gray-400 mt-1 font-hindi">
                {located
                  ? '✅ अब आस-पास के workers की दूरी सही दिखेगी / Nearby worker distance will be accurate'
                  : 'सही "nearby" matching के लिए लोकेशन दें — शहर/एरिया fallback है / Add location for accurate nearby matching (city/area is fallback)'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">पासवर्ड * / Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="कम से कम 6 अक्षर / Min 6 characters"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base" autoComplete="new-password" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">पासवर्ड दोबारा * / Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="फिर से डालें / Re-enter password"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base" autoComplete="new-password" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-brand-navy text-white font-bold py-4 rounded-xl hover:bg-brand-navy-dark disabled:opacity-50 font-hindi">
              {loading ? '⏳ बन रहा है...' : 'Account बनाएँ / Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-4">
            <Link href="/auth/login" className="text-brand-navy font-semibold hover:underline">पहले से account है? Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
