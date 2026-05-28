'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Lock, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const submitRef = useRef(false);

  function startResendTimer() {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer(prev => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
    }, 1000);
  }

  async function handleSendCode(e) {
    e?.preventDefault();
    if (!/^[6-9]\d{9}$/.test(mobile)) { toast.error('10 अंकों का सही नंबर डालें / Enter valid 10-digit number'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || 'कोड भेजने में error / Failed to send code'); return; }
      setOtp(['', '', '', '', '', '']);
      setStep(2);
      startResendTimer();
      toast.success('Reset code भेजा गया / Reset code sent to your email');
      setTimeout(() => otpRefs[0].current?.focus(), 100);
    } catch {
      toast.error('इंटरनेट कनेक्शन चेक करें / Check internet connection');
    } finally { setLoading(false); }
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

  async function handleVerifyCode(e) {
    e?.preventDefault();
    if (submitRef.current) return;
    const otpValue = otp.join('');
    if (otpValue.length !== 6) { toast.error('6 अंकों का कोड डालें / Enter 6-digit code'); return; }
    submitRef.current = true; setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp: otpValue }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || 'गलत कोड / Wrong code'); setOtp(['', '', '', '', '', '']); otpRefs[0].current?.focus(); return; }
      setResetToken(data.token);
      setStep(3);
    } catch {
      toast.error('कुछ गड़बड़ हुई / Something went wrong');
    } finally { setLoading(false); submitRef.current = false; }
  }

  async function handleReset(e) {
    e.preventDefault();
    if (password.length < 6) { toast.error('पासवर्ड कम से कम 6 अक्षर का हो / Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { toast.error('पासवर्ड मेल नहीं खाते / Passwords do not match'); return; }
    if (submitRef.current) return;
    submitRef.current = true; setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, token: resetToken, password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || 'Reset failed'); return; }
      const token = data.token || data.data?.token;
      const user = data.user || data.data?.user;
      if (token && user) {
        localStorage.setItem('kaamsetu_token', token);
        localStorage.setItem('kaamsetu_user', JSON.stringify(user));
      }
      toast.success('पासवर्ड बदल गया! / Password updated!');
      setTimeout(() => router.push('/client/dashboard'), 800);
    } catch {
      toast.error('कुछ गड़बड़ हुई / Something went wrong');
    } finally { setLoading(false); submitRef.current = false; }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <div className="bg-brand-navy px-4 py-4 flex items-center gap-3">
        <button onClick={() => step > 1 ? setStep(step - 1) : router.push('/auth/login')}
          className="text-white/70 hover:text-white min-h-0"><ChevronLeft size={24} /></button>
        <span className="font-black text-white">KAAM<span className="text-brand-yellow">SETU</span></span>
      </div>

      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-sm mx-auto flex gap-2">
          {[1, 2, 3].map(i => <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= step ? 'bg-brand-navy' : 'bg-gray-200'}`} />)}
        </div>
        <p className="text-center text-xs text-gray-400 mt-1">Step {step} of 3</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-2xl mx-auto mb-5">
            <Lock size={28} className="text-brand-navy" />
          </div>
          <h1 className="text-xl font-black text-brand-navy text-center font-hindi mb-1">पासवर्ड भूल गए?</h1>
          <p className="text-gray-400 text-sm text-center mb-6">Reset your password / नया पासवर्ड सेट करें</p>

          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">मोबाइल नंबर</label>
                <div className="flex gap-2">
                  <span className="flex items-center bg-gray-100 border border-gray-200 rounded-xl px-3 text-gray-600 text-sm">+91</span>
                  <input type="tel" inputMode="numeric" maxLength={10} value={mobile}
                    onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile"
                    className="flex-1 px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base" autoFocus />
                </div>
                <p className="text-xs text-gray-400 mt-1">Reset code आपके registered email पर भेजा जाएगा</p>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-brand-navy text-white font-bold py-4 rounded-xl hover:bg-brand-navy-dark disabled:opacity-50 font-hindi">
                {loading ? '⏳ भेज रहे हैं...' : 'कोड भेजें / Send Code'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <p className="text-gray-500 text-sm text-center">Email पर भेजा गया code डालें / Enter the code sent to your email</p>
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
                  : <button type="button" onClick={handleSendCode} className="flex items-center gap-1 text-brand-navy text-sm font-semibold mx-auto min-h-0"><RefreshCw size={13} /> Resend Code</button>}
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">नया पासवर्ड / New Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="कम से कम 6 अक्षर / Min 6 characters"
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base" autoComplete="new-password" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">पासवर्ड दोबारा / Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="फिर से डालें / Re-enter password"
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base" autoComplete="new-password" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-brand-navy text-white font-bold py-4 rounded-xl hover:bg-brand-navy-dark disabled:opacity-50 font-hindi">
                {loading ? '⏳ Save हो रहा है...' : 'पासवर्ड बदलें / Reset Password'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gray-400 mt-4">
            <Link href="/auth/login" className="text-brand-navy font-semibold hover:underline font-hindi">Login पर वापस जाएँ / Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
