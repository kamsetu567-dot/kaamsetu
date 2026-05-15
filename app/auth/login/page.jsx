'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Phone, ArrowRight, ChevronLeft, Wrench, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const submitRef = useRef(false);

  function startResendTimer() {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSendOTP(e) {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      toast.error('10 अंकों का सही नंबर डालें / Enter valid 10-digit number');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'OTP भेजने में error हुई');
        return;
      }
      setOtp(['', '', '', '', '', '']);
      setStep(2);
      startResendTimer();
      setTimeout(() => otpRefs[0].current?.focus(), 100);
    } catch {
      toast.error('इंटरनेट कनेक्शन चेक करें / Check internet connection');
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index, value) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs[index + 1].current?.focus();
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  }

  function handleOtpPaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs[5].current?.focus();
    }
  }

  async function handleVerifyOTP(e) {
    e?.preventDefault();
    if (submitRef.current) return;
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      toast.error('6 अंकों का OTP डालें / Enter 6-digit OTP');
      return;
    }
    submitRef.current = true;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp: otpValue, mode: 'login' }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404) {
          toast.error('Account नहीं मिला। पहले sign up करें / Account not found');
          setTimeout(() => router.push('/auth/select-role'), 1500);
        } else {
          toast.error(data.message || 'OTP गलत है / Wrong OTP');
        }
        setOtp(['', '', '', '', '', '']);
        otpRefs[0].current?.focus();
        return;
      }
      const token = data.token || data.data?.token;
      const user = data.user || data.data?.user;
      localStorage.setItem('kaamsetu_token', token);
      localStorage.setItem('kaamsetu_user', JSON.stringify(user));
      toast.success('Login सफल! / Login successful!');
      const role = user?.role;
      setTimeout(() => {
        if (role === 'worker') router.push('/worker/dashboard');
        else if (role === 'client') router.push('/client/dashboard');
        else if (role === 'shop') router.push('/shop/dashboard');
        else if (role === 'admin') router.push('/admin');
        else router.push('/');
      }, 500);
    } catch {
      toast.error('कुछ गड़बड़ हुई / Something went wrong');
    } finally {
      setLoading(false);
      submitRef.current = false;
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left panel — desktop only */}
      <div className="hidden md:flex md:w-1/2 gradient-hero flex-col justify-center items-center px-12 text-center">
        <div className="w-20 h-20 bg-brand-yellow rounded-2xl flex items-center justify-center mb-6">
          <Wrench size={40} className="text-brand-navy" />
        </div>
        <h1 className="text-4xl font-black text-white font-hindi mb-3">KAAM<span className="text-brand-yellow">SETU</span></h1>
        <p className="text-white/80 font-hindi text-lg mb-2">हर काम, हर जगह</p>
        <p className="text-white/60 text-sm">India's #1 Local Service Platform</p>
        <div className="mt-10 space-y-3 text-left">
          {['1000+ Verified Workers', '50+ Service Categories', '100+ Cities covered'].map(t => (
            <div key={t} className="flex items-center gap-2 text-white/80 text-sm">
              <span className="text-brand-yellow">✓</span> {t}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 bg-white flex flex-col">
        {/* Mobile top bar */}
        <div className="md:hidden bg-brand-navy px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-white/70 hover:text-white min-h-0">
            <ChevronLeft size={24} />
          </Link>
          <span className="font-black text-white">KAAM<span className="text-brand-yellow">SETU</span></span>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-brand-navy font-hindi mb-1">
                {step === 1 ? 'लॉगिन करें' : 'OTP Verify करें'}
              </h2>
              <p className="text-gray-500 text-sm">
                {step === 1 ? 'Login to KaamSetu' : `OTP sent to +91${mobile}`}
              </p>
            </div>

            {step === 1 ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">मोबाइल नंबर</label>
                  <div className="flex gap-2">
                    <span className="flex items-center justify-center bg-gray-100 border border-gray-200 rounded-xl px-3 text-gray-600 font-medium text-sm flex-shrink-0">
                      +91
                    </span>
                    <input
                      type="tel" inputMode="numeric" maxLength={10}
                      value={mobile}
                      onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number"
                      className="flex-1 px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base"
                      autoFocus
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-brand-navy text-white font-bold py-4 rounded-xl hover:bg-brand-navy-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-hindi">
                  {loading ? <><span className="animate-spin">⏳</span> भेज रहे हैं...</> : <><Phone size={18} /> OTP भेजें / Send OTP</>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 font-hindi">OTP डालें</label>
                  <div className="flex gap-2 justify-center">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={otpRefs[i]}
                        type="tel" inputMode="numeric" maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        className="w-11 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy"
                      />
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-brand-navy text-white font-bold py-4 rounded-xl hover:bg-brand-navy-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-hindi">
                  {loading ? <><span className="animate-spin">⏳</span> Verify हो रहा है...</> : <><ArrowRight size={18} /> Verify करें / Verify</>}
                </button>
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-gray-400 text-sm font-hindi">{resendTimer}s में Resend कर सकते हैं</p>
                  ) : (
                    <button type="button" onClick={handleSendOTP} disabled={loading}
                      className="flex items-center gap-1 text-brand-navy text-sm font-semibold hover:underline mx-auto min-h-0">
                      <RefreshCw size={14} /> दोबारा भेजें / Resend OTP
                    </button>
                  )}
                </div>
                <button type="button" onClick={() => { setStep(1); setOtp(['','','','','','']); }}
                  className="flex items-center gap-1 text-gray-400 text-sm hover:text-gray-600 mx-auto min-h-0">
                  <ChevronLeft size={14} /> नंबर बदलें / Change number
                </button>
              </form>
            )}

            {/* Testing notice */}
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5 text-center">
              <p className="text-yellow-700 text-xs font-medium">
                🔧 Testing: Use OTP <strong>123456</strong>
              </p>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              <span className="font-hindi">Account नहीं है? </span>
              <Link href="/auth/select-role" className="text-brand-navy font-bold hover:underline">
                साइन अप करें
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
