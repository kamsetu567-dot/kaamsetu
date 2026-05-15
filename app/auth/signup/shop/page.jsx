'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Store, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { CATEGORIES } from '@/lib/data/categories';

export default function ShopSignupPage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(1);

  // Step 1 — Mobile + OTP
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  // Step 2 — Shop Info
  const [ownerName, setOwnerName] = useState('');
  const [shopName, setShopName] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');

  // Step 3 — Business Details
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const submitRef = useRef(false);

  function startResendTimer() {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer(prev => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
    }, 1000);
  }

  async function handleSendOTP(e) {
    e?.preventDefault();
    if (!/^[6-9]\d{9}$/.test(mobile)) { toast.error('10 अंकों का सही नंबर डालें'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mobile }) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || 'OTP भेजने में error'); return; }
      setOtp(['', '', '', '', '', '']); setOtpSent(true); startResendTimer();
      setTimeout(() => otpRefs[0].current?.focus(), 100);
    } catch { toast.error('इंटरनेट कनेक्शन चेक करें'); } finally { setLoading(false); }
  }

  function handleOtpChange(index, value) {
    if (!/^\d*$/.test(value)) return;
    const n = [...otp]; n[index] = value.slice(-1); setOtp(n);
    if (value && index < 5) otpRefs[index + 1].current?.focus();
  }
  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs[index - 1].current?.focus();
  }
  function handleOtpPaste(e) {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (p.length === 6) { setOtp(p.split('')); otpRefs[5].current?.focus(); }
  }

  async function handleVerifyOTP(e) {
    e?.preventDefault();
    if (submitRef.current) return;
    const otpValue = otp.join('');
    if (otpValue.length !== 6) { toast.error('6 अंकों का OTP डालें'); return; }
    submitRef.current = true; setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mobile, otp: otpValue, mode: 'signup' }) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || 'OTP गलत है'); setOtp(['','','','','','']); otpRefs[0].current?.focus(); return; }
      setTempToken(data.token); setStep(2);
    } catch { toast.error('कुछ गड़बड़ हुई'); } finally { setLoading(false); submitRef.current = false; }
  }

  function handleStep2Next() {
    if (!ownerName.trim()) { toast.error('नाम डालें'); return; }
    if (!shopName.trim()) { toast.error('दुकान का नाम डालें'); return; }
    if (!city.trim()) { toast.error('शहर डालें'); return; }
    setStep(3);
  }

  async function handleSignup() {
    if (!category) { toast.error('Category चुनें'); return; }
    if (submitRef.current) return;
    submitRef.current = true; setLoading(true);
    try {
      const res = await fetch('/api/auth/signup/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, ownerName, shopName, city, area, category, description, token: tempToken }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || 'Signup failed'); return; }
      const token = data.token || data.data?.token;
      const user = data.user || data.data?.user || { mobile, name: ownerName, role: 'shop' };
      localStorage.setItem('kaamsetu_token', token);
      localStorage.setItem('kaamsetu_user', JSON.stringify(user));
      toast.success('Shop register हो गई! / Shop registered!');
      setTimeout(() => router.push('/shop/dashboard'), 800);
    } catch { toast.error('कुछ गड़बड़ हुई'); } finally { setLoading(false); submitRef.current = false; }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <div className="bg-brand-navy px-4 py-4 flex items-center gap-3">
        <button onClick={() => step > 1 ? setStep(step - 1) : router.push('/auth/select-role')}
          className="text-white/70 hover:text-white min-h-0"><ChevronLeft size={24} /></button>
        <span className="font-black text-white">KAAM<span className="text-brand-yellow">SETU</span></span>
      </div>

      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-sm mx-auto flex gap-2">
          {[1,2,3].map(i => <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= step ? 'bg-brand-navy' : 'bg-gray-200'}`} />)}
        </div>
        <p className="text-center text-xs text-gray-400 mt-1">Step {step} of 3</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-center w-14 h-14 bg-brand-yellow rounded-2xl mx-auto mb-5">
            <Store size={28} className="text-brand-navy" />
          </div>
          <h1 className="text-xl font-black text-brand-navy text-center font-hindi mb-1">Shop / Business Sign Up</h1>
          <p className="text-gray-400 text-sm text-center mb-6">
            {step === 1 ? 'मोबाइल नंबर verify करें' : step === 2 ? 'दुकान की जानकारी भरें' : 'Business details'}
          </p>

          {/* STEP 1 — Mobile + OTP */}
          {step === 1 && !otpSent && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">मोबाइल नंबर</label>
                <div className="flex gap-2">
                  <span className="flex items-center bg-gray-100 border border-gray-200 rounded-xl px-3 text-gray-600 text-sm">+91</span>
                  <input type="tel" inputMode="numeric" maxLength={10} value={mobile}
                    onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile"
                    className="flex-1 px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base" autoFocus />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-brand-navy text-white font-bold py-4 rounded-xl disabled:opacity-50 font-hindi">
                {loading ? '⏳ भेज रहे हैं...' : 'OTP भेजें / Send OTP'}
              </button>
            </form>
          )}

          {step === 1 && otpSent && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <p className="text-gray-500 text-sm text-center font-hindi">+91{mobile} पर OTP भेजा गया</p>
              <div className="flex gap-2 justify-center">
                {otp.map((d, i) => (
                  <input key={i} ref={otpRefs[i]} type="tel" inputMode="numeric" maxLength={1} value={d}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    className="w-11 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy" />
                ))}
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-brand-navy text-white font-bold py-4 rounded-xl disabled:opacity-50 font-hindi">
                {loading ? '⏳ Verify हो रहा है...' : 'Verify करें / Verify'}
              </button>
              <div className="text-center">
                {resendTimer > 0
                  ? <p className="text-gray-400 text-xs font-hindi">{resendTimer}s में Resend</p>
                  : <button type="button" onClick={handleSendOTP} className="flex items-center gap-1 text-brand-navy text-sm font-semibold mx-auto min-h-0"><RefreshCw size={13} /> Resend OTP</button>}
              </div>
              <button type="button" onClick={() => { setOtpSent(false); setOtp(['','','','','','']); }}
                className="flex items-center gap-1 text-gray-400 text-sm mx-auto min-h-0 font-hindi">
                <ChevronLeft size={14} /> नंबर बदलें
              </button>
            </form>
          )}

          {/* STEP 2 — Shop Info */}
          {step === 2 && (
            <div className="space-y-4">
              {[
                { label: 'आपका नाम *', ph: 'Owner Name', val: ownerName, set: setOwnerName },
                { label: 'दुकान / Business का नाम *', ph: 'Shop Name', val: shopName, set: setShopName },
                { label: 'शहर *', ph: 'City', val: city, set: setCity },
                { label: 'एरिया / Mohalla', ph: 'Area (optional)', val: area, set: setArea },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">{f.label}</label>
                  <input type="text" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base" />
                </div>
              ))}
              <button type="button" onClick={handleStep2Next}
                className="w-full bg-brand-navy text-white font-bold py-4 rounded-xl font-hindi">
                आगे बढ़ें / Next →
              </button>
            </div>
          )}

          {/* STEP 3 — Business Details */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-hindi">Business Category *</label>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} type="button" onClick={() => setCategory(cat.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-colors ${category === cat.id ? 'border-brand-navy bg-blue-50' : 'border-gray-200'}`}>
                      <p className="text-xs font-bold text-brand-navy font-hindi leading-tight">{cat.nameHi}</p>
                      <p className="text-xs text-gray-400">{cat.nameEn}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">Business Description (optional)</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="आपकी दुकान / business के बारे में बताएँ..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base resize-none font-hindi" />
              </div>

              <button type="button" onClick={handleSignup} disabled={loading}
                className="w-full bg-brand-yellow text-brand-navy font-bold py-4 rounded-xl disabled:opacity-50 font-hindi">
                {loading ? '⏳ बन रहा है...' : 'Register करें / Create Account'}
              </button>
            </div>
          )}

          <div className="mt-5 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 text-center">
            <p className="text-yellow-700 text-xs">🔧 Testing: Use OTP <strong>123456</strong></p>
          </div>
          <p className="text-center text-sm text-gray-400 mt-4">
            <Link href="/auth/login" className="text-brand-navy font-semibold hover:underline">पहले से account है? Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
