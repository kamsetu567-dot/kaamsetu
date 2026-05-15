'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Wrench, RefreshCw, Upload, X } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { CATEGORIES } from '@/lib/data/categories';

const ICONS = { Hammer: '🔨', Home: '🏠', PartyPopper: '🎉', GraduationCap: '🎓', Sparkles: '✨', Car: '🚗', Store: '🏪', Settings: '⚙️', Heart: '❤️', Shield: '🛡️', Package: '📦' };

export default function WorkerSignupPage() {
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

  // Step 2 — Basic Info
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [experience, setExperience] = useState('');
  const [gender, setGender] = useState('');

  // Step 3 — Profession
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [serviceType, setServiceType] = useState('');

  // Step 4 — Documents
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [workPhotos, setWorkPhotos] = useState([]);
  const [aadharFront, setAadharFront] = useState(null);
  const [aadharBack, setAadharBack] = useState(null);
  const [aadharNumber, setAadharNumber] = useState('');

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
    if (!name.trim()) { toast.error('नाम डालें'); return; }
    if (!city.trim()) { toast.error('शहर डालें'); return; }
    if (!gender) { toast.error('Gender चुनें'); return; }
    setStep(3);
  }

  function handleStep3Next() {
    if (!category) { toast.error('Category चुनें'); return; }
    if (!serviceType) { toast.error('Service type चुनें'); return; }
    setStep(4);
  }

  async function handleSignup() {
    if (submitRef.current) return;
    submitRef.current = true; setLoading(true);
    try {
      const res = await fetch('/api/auth/signup/worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, name, city, area, experience: Number(experience) || 0, gender, category, subcategory, serviceType, aadharNumber, token: tempToken }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || 'Signup failed'); return; }
      const token = data.token || data.data?.token;
      const user = data.user || data.data?.user || { mobile, name, role: 'worker' };
      localStorage.setItem('kaamsetu_token', token);
      localStorage.setItem('kaamsetu_user', JSON.stringify(user));
      toast.success('Registration हो गई! / Registration successful!');
      setTimeout(() => router.push('/worker/dashboard'), 800);
    } catch { toast.error('कुछ गड़बड़ हुई'); } finally { setLoading(false); submitRef.current = false; }
  }

  const selectedCategoryData = CATEGORIES.find(c => c.id === category);

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <div className="bg-brand-navy px-4 py-4 flex items-center gap-3">
        <button onClick={() => step > 1 ? setStep(step - 1) : router.push('/auth/select-role')}
          className="text-white/70 hover:text-white min-h-0"><ChevronLeft size={24} /></button>
        <span className="font-black text-white">KAAM<span className="text-brand-yellow">SETU</span></span>
      </div>

      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-sm mx-auto flex gap-2">
          {[1,2,3,4].map(i => <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= step ? 'bg-brand-navy' : 'bg-gray-200'}`} />)}
        </div>
        <p className="text-center text-xs text-gray-400 mt-1">Step {step} of 4</p>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-center w-14 h-14 bg-brand-navy rounded-2xl mx-auto mb-5">
            <Wrench size={28} className="text-brand-yellow" />
          </div>
          <h1 className="text-xl font-black text-brand-navy text-center font-hindi mb-1">Worker Sign Up</h1>
          <p className="text-gray-400 text-sm text-center mb-6">
            {step === 1 ? 'मोबाइल नंबर verify करें' : step === 2 ? 'बेसिक जानकारी भरें' : step === 3 ? 'काम की जानकारी' : 'Documents Upload करें'}
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

          {/* STEP 2 — Basic Info */}
          {step === 2 && (
            <div className="space-y-4">
              {[
                { label: 'पूरा नाम *', ph: 'Full Name', val: name, set: setName },
                { label: 'शहर *', ph: 'City', val: city, set: setCity },
                { label: 'एरिया / Mohalla', ph: 'Area (optional)', val: area, set: setArea },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">{f.label}</label>
                  <input type="text" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base" />
                </div>
              ))}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">अनुभव (साल में)</label>
                <input type="number" min={0} max={50} value={experience} onChange={e => setExperience(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-hindi">लिंग / Gender *</label>
                <div className="flex gap-3">
                  {[{ v: 'male', hi: 'पुरुष', en: 'Male' }, { v: 'female', hi: 'महिला', en: 'Female' }].map(g => (
                    <button key={g.v} type="button" onClick={() => setGender(g.v)}
                      className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-colors font-hindi ${gender === g.v ? 'bg-brand-navy text-white border-brand-navy' : 'border-gray-200 text-gray-600'}`}>
                      {g.hi} / {g.en}
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" onClick={handleStep2Next}
                className="w-full bg-brand-navy text-white font-bold py-4 rounded-xl font-hindi">
                आगे बढ़ें / Next →
              </button>
            </div>
          )}

          {/* STEP 3 — Profession */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 font-hindi">Category चुनें *</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} type="button" onClick={() => { setCategory(cat.id); setSubcategory(''); }}
                      className={`p-3 rounded-xl border-2 text-left transition-colors ${category === cat.id ? 'border-brand-navy bg-blue-50' : 'border-gray-200'}`}>
                      <span className="text-xl">{ICONS[cat.icon] || '🔧'}</span>
                      <p className="text-xs font-bold text-brand-navy mt-1 font-hindi leading-tight">{cat.nameHi}</p>
                    </button>
                  ))}
                </div>
              </div>

              {selectedCategoryData?.subcategories?.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">Subcategory (optional)</label>
                  <select value={subcategory} onChange={e => setSubcategory(e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base bg-white">
                    <option value="">-- चुनें --</option>
                    {selectedCategoryData.subcategories.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-hindi">Service Type *</label>
                <div className="space-y-2">
                  {[
                    { v: 'home_visit', hi: 'घर पर आकर काम', en: 'Home Visit' },
                    { v: 'shop_office', hi: 'दुकान / ऑफिस पर', en: 'At Shop/Office' },
                    { v: 'both', hi: 'दोनों', en: 'Both' },
                  ].map(st => (
                    <button key={st.v} type="button" onClick={() => setServiceType(st.v)}
                      className={`w-full py-3 px-4 rounded-xl border-2 font-semibold text-left transition-colors font-hindi ${serviceType === st.v ? 'bg-brand-navy text-white border-brand-navy' : 'border-gray-200 text-gray-600'}`}>
                      {st.hi} / {st.en}
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" onClick={handleStep3Next}
                className="w-full bg-brand-navy text-white font-bold py-4 rounded-xl font-hindi">
                आगे बढ़ें / Next →
              </button>
            </div>
          )}

          {/* STEP 4 — Documents */}
          {step === 4 && (
            <div className="space-y-5">
              {/* Profile Photo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-hindi">Profile Photo (optional)</label>
                <label className="block cursor-pointer">
                  {profilePhoto ? (
                    <div className="relative inline-block">
                      <img src={profilePhoto} alt="Profile" className="w-20 h-20 rounded-full object-cover border-4 border-brand-navy" />
                      <button type="button" onClick={() => setProfilePhoto(null)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 min-h-0">
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-brand-navy transition-colors">
                      <Upload size={24} className="text-gray-400 mx-auto mb-1" />
                      <p className="text-gray-400 text-xs font-hindi">फ़ोटो Upload करें</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) { setProfilePhoto(URL.createObjectURL(f)); setProfilePhotoFile(f); }}} />
                </label>
              </div>

              {/* Work Photos */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-hindi">काम की फ़ोटो (up to 5)</label>
                <div className="grid grid-cols-3 gap-2">
                  {workPhotos.map((url, i) => (
                    <div key={i} className="relative">
                      <img src={url} alt="" className="w-full aspect-square object-cover rounded-xl border border-gray-200" />
                      <button type="button" onClick={() => setWorkPhotos(p => p.filter((_, j) => j !== i))}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 min-h-0"><X size={11} /></button>
                    </div>
                  ))}
                  {workPhotos.length < 5 && (
                    <label className="cursor-pointer border-2 border-dashed border-gray-200 rounded-xl aspect-square flex items-center justify-center hover:border-brand-navy transition-colors">
                      <Upload size={20} className="text-gray-400" />
                      <input type="file" accept="image/*" multiple className="hidden"
                        onChange={e => { const urls = Array.from(e.target.files || []).slice(0, 5 - workPhotos.length).map(f => URL.createObjectURL(f)); setWorkPhotos(p => [...p, ...urls].slice(0, 5)); }} />
                    </label>
                  )}
                </div>
              </div>

              {/* Aadhar Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">आधार नंबर (optional)</label>
                <input type="tel" inputMode="numeric" maxLength={12} value={aadharNumber}
                  onChange={e => setAadharNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="12-digit Aadhar number"
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base" />
              </div>

              {/* Subscription notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="font-black text-brand-navy text-lg mb-0.5">₹199/month</p>
                <p className="text-yellow-700 text-xs font-hindi">Admin approval के बाद subscription start होगी।</p>
              </div>

              <button type="button" onClick={handleSignup} disabled={loading}
                className="w-full bg-brand-yellow text-brand-navy font-bold py-4 rounded-xl disabled:opacity-50 font-hindi">
                {loading ? '⏳ बन रहा है...' : 'Register करें / Submit'}
              </button>
            </div>
          )}

          {/* Testing notice */}
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
