"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle, Upload, Wrench, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { signupWorker } from "@/lib/api/auth";
import MobileInput from "@/components/MobileInput";
import OTPInput from "@/components/OTPInput";
import CategorySelect from "@/components/CategorySelect";
import { CATEGORIES } from "@/lib/data/categories";

const STEP_LABELS = ["Basic Info", "Profession", "Documents"];

export default function WorkerSignupPage() {
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [mobileVerified, setMobileVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [gender, setGender] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [workStatus, setWorkStatus] = useState("free");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [workPhotos, setWorkPhotos] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, getValues } = useForm();

  function handlePhotoUpload(e, type) {
    const files = Array.from(e.target.files || []);
    if (type === "profile") {
      const url = URL.createObjectURL(files[0]);
      setProfilePhoto(url);
    } else {
      const urls = files.slice(0, 5).map(f => URL.createObjectURL(f));
      setWorkPhotos(prev => [...prev, ...urls].slice(0, 5));
    }
  }

  async function handleFinalSubmit() {
    setLoading(true);
    await signupWorker({
      ...getValues(),
      mobile,
      category: selectedCategory,
      subcategory: selectedSubcategory,
      gender,
      serviceType,
      workStatus,
    });
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-neutral-bg flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border-2 border-border-light p-10 text-center max-w-sm w-full shadow-xl">
          <CheckCircle size={64} className="text-primary-green mx-auto mb-4" />
          <h2 className="text-2xl font-black text-text-primary mb-3" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            Application Submit हो गई!
          </h2>
          <p className="text-text-secondary mb-2" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            Admin approval के बाद आपको notification मिलेगा।
          </p>
          <p className="text-text-secondary text-sm mb-6">You will be notified after admin approval.</p>
          <Link href="/" className="block bg-primary-navy text-white font-bold py-4 rounded-2xl hover:bg-blue-900 transition-colors">
            <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>Home पर जाएं / Go Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-bg flex flex-col">
      {/* Header */}
      <div className="bg-primary-navy px-4 py-4 flex items-center gap-3">
        <Link href="/auth/signup" className="text-white/70 hover:text-white" aria-label="Back">
          <ArrowLeft size={24} />
        </Link>
        <div className="flex items-center gap-2">
          <Wrench size={20} className="text-accent-yellow" />
          <span className="font-black text-white text-lg">Worker Registration</span>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-border-light px-4 py-4">
        <div className="max-w-md mx-auto flex items-center gap-2">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const done = step > n;
            const active = step === n;
            return (
              <div key={n} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  done ? "bg-primary-green text-white" : active ? "bg-primary-orange text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {done ? "✓" : n}
                </div>
                <span className={`text-xs ${active ? "font-bold text-primary-orange" : "text-text-secondary"} hidden sm:block`}>
                  {label}
                </span>
                {i < STEP_LABELS.length - 1 && <div className="flex-1 h-0.5 bg-gray-200 ml-2" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-start justify-center px-4 py-6">
        <div className="w-full max-w-md bg-white rounded-3xl border-2 border-border-light p-6 shadow-lg">

          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-black text-text-primary" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
                Step 1: Basic Info / बेसिक जानकारी
              </h2>
              <div>
                <label className="block mb-1.5 font-semibold">
                  <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>नाम</span>
                  <span className="text-text-secondary font-normal"> / Name *</span>
                </label>
                <input
                  {...register("name", { required: "नाम जरूरी है" })}
                  placeholder="पूरा नाम / Full Name"
                  className="w-full px-4 py-4 text-base border-2 border-border-light rounded-xl focus:outline-none focus:border-primary-orange"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block mb-1.5 font-semibold">
                  <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>मोबाइल नंबर</span>
                  <span className="text-text-secondary font-normal"> / Mobile Number *</span>
                </label>
                <MobileInput value={mobile} onChange={setMobile} />
                {!otpSent && (
                  <button type="button" onClick={() => mobile.length === 10 && setOtpSent(true)} className="mt-2 text-primary-blue text-sm font-semibold">
                    OTP भेजें / Send OTP
                  </button>
                )}
                {otpSent && !mobileVerified && (
                  <div className="mt-3 space-y-2">
                    <OTPInput value={otp} onChange={setOtp} />
                    <button type="button" onClick={() => otp.length === 6 && setMobileVerified(true)} className="w-full bg-primary-blue text-white font-bold py-2 rounded-xl text-sm">
                      Verify OTP
                    </button>
                    <p className="text-xs text-center text-text-secondary">(Demo: any 6 digits)</p>
                  </div>
                )}
                {mobileVerified && <p className="text-primary-green text-sm mt-1 font-semibold">✓ Verified!</p>}
              </div>
              <button
                type="button"
                disabled={!mobileVerified}
                onClick={() => setStep(2)}
                className="w-full flex items-center justify-center gap-2 bg-primary-orange text-white font-black text-lg py-4 rounded-2xl hover:bg-orange-600 transition-colors disabled:opacity-50 min-h-14"
              >
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>आगे बढ़ें</span>
                <span>/ Next</span>
                <ArrowRight size={20} />
              </button>
            </div>
          )}

          {/* STEP 2: Profession */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-black text-text-primary" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
                Step 2: काम की जानकारी / Profession
              </h2>

              <CategorySelect
                value={selectedCategory}
                onChange={setSelectedCategory}
                level="main"
                label="Category"
                labelEn="Service Category"
              />

              {selectedCategory && selectedCategory !== "__other__" && (
                <CategorySelect
                  value={selectedSubcategory}
                  onChange={setSelectedSubcategory}
                  level="sub"
                  parentSlug={selectedCategory}
                  label="Subcategory"
                  labelEn="Specific Skill"
                />
              )}

              <div>
                <label className="block mb-1.5 font-semibold">
                  <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>अनुभव</span>
                  <span className="text-text-secondary font-normal"> / Experience (years)</span>
                </label>
                <input
                  {...register("experience", { required: true, min: 0 })}
                  type="number"
                  min={0}
                  placeholder="0"
                  className="w-full px-4 py-4 text-base border-2 border-border-light rounded-xl focus:outline-none focus:border-primary-orange"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 font-semibold text-sm">
                    <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>शहर</span>
                    <span className="text-text-secondary font-normal"> / City</span>
                  </label>
                  <input
                    {...register("city", { required: true })}
                    placeholder="City"
                    className="w-full px-4 py-3 text-sm border-2 border-border-light rounded-xl focus:outline-none focus:border-primary-orange"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 font-semibold text-sm">
                    <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>एरिया</span>
                    <span className="text-text-secondary font-normal"> / Area</span>
                  </label>
                  <input
                    {...register("area")}
                    placeholder="Area / Mohalla"
                    className="w-full px-4 py-3 text-sm border-2 border-border-light rounded-xl focus:outline-none focus:border-primary-orange"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block mb-2 font-semibold">
                  <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>लिंग</span>
                  <span className="text-text-secondary font-normal"> / Gender *</span>
                </label>
                <div className="flex gap-3">
                  {[{ value: "male", hi: "पुरुष", en: "Male" }, { value: "female", hi: "महिला", en: "Female" }].map(g => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGender(g.value)}
                      className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-colors ${
                        gender === g.value ? "bg-primary-blue text-white border-primary-blue" : "border-border-light text-text-secondary"
                      }`}
                    >
                      <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{g.hi}</span>
                      <span className="text-sm font-normal"> / {g.en}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Type */}
              <div>
                <label className="block mb-2 font-semibold">
                  <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>सेवा का प्रकार</span>
                  <span className="text-text-secondary font-normal"> / Service Type *</span>
                </label>
                <div className="space-y-2">
                  {[
                    { value: "home_visit", hi: "घर पर आकर", en: "Home Visit" },
                    { value: "shop_office", hi: "दुकान / ऑफिस पर", en: "Shop or Office" },
                    { value: "both", hi: "दोनों", en: "Both" },
                  ].map(st => (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() => setServiceType(st.value)}
                      className={`w-full py-3 px-4 rounded-xl border-2 font-semibold text-left transition-colors ${
                        serviceType === st.value ? "bg-primary-green text-white border-primary-green" : "border-border-light text-text-secondary"
                      }`}
                    >
                      <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{st.hi}</span>
                      <span className="font-normal"> / {st.en}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Work Status */}
              <div>
                <label className="block mb-2 font-semibold">
                  <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>काम की स्थिति</span>
                  <span className="text-text-secondary font-normal"> / Work Status</span>
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setWorkStatus("free")}
                    className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-colors ${workStatus === "free" ? "bg-primary-green text-white border-primary-green" : "border-border-light text-text-secondary"}`}
                  >
                    🟢 <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>खाली हूँ</span>
                    <span className="text-sm font-normal block">Free</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkStatus("working")}
                    className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-colors ${workStatus === "working" ? "bg-working-orange text-white border-working-orange" : "border-border-light text-text-secondary"}`}
                  >
                    🔴 <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>व्यस्त हूँ</span>
                    <span className="text-sm font-normal block">Busy</span>
                  </button>
                </div>
                <p className="text-xs text-text-secondary mt-1" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
                  आप यह बाद में dashboard से भी बदल सकते हैं / You can change this later from dashboard
                </p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="flex-1 border-2 border-border-light text-text-secondary font-bold py-4 rounded-2xl hover:border-gray-400 transition-colors">
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!selectedCategory || !gender || !serviceType}
                  className="flex-2 flex-1 flex items-center justify-center gap-2 bg-primary-orange text-white font-black text-lg py-4 rounded-2xl hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>आगे बढ़ें</span> <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Documents */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-black text-text-primary" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
                Step 3: Documents & Photos
              </h2>

              {/* Profile Photo */}
              <div>
                <label className="block mb-2 font-semibold">
                  <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>प्रोफाइल फ़ोटो</span>
                  <span className="text-text-secondary font-normal"> / Profile Photo</span>
                </label>
                <label className="block cursor-pointer">
                  {profilePhoto ? (
                    <div className="relative inline-block">
                      <img src={profilePhoto} alt="Profile preview" className="w-24 h-24 rounded-full object-cover border-4 border-primary-orange" />
                      <button type="button" onClick={() => setProfilePhoto(null)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border-light rounded-2xl p-6 text-center hover:border-primary-orange transition-colors">
                      <Upload size={32} className="text-gray-400 mx-auto mb-2" />
                      <p className="text-text-secondary text-sm" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>फ़ोटो Upload करें / Upload Photo</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, "profile")} aria-label="Upload profile photo" />
                </label>
              </div>

              {/* Work Photos */}
              <div>
                <label className="block mb-2 font-semibold">
                  <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>काम की फ़ोटो</span>
                  <span className="text-text-secondary font-normal"> / Work Photos (up to 5)</span>
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {workPhotos.map((url, i) => (
                    <div key={i} className="relative">
                      <img src={url} alt={`Work photo ${i + 1}`} className="w-full aspect-square object-cover rounded-xl border-2 border-border-light" />
                      <button type="button" onClick={() => setWorkPhotos(p => p.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {workPhotos.length < 5 && (
                    <label className="cursor-pointer border-2 border-dashed border-border-light rounded-xl aspect-square flex items-center justify-center hover:border-primary-orange transition-colors">
                      <Upload size={24} className="text-gray-400" />
                      <input type="file" accept="image/*" multiple className="hidden" onChange={e => handlePhotoUpload(e, "work")} aria-label="Upload work photos" />
                    </label>
                  )}
                </div>
              </div>

              {/* Aadhar */}
              <div>
                <label className="block mb-2 font-semibold">
                  <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>आधार कार्ड</span>
                  <span className="text-text-secondary font-normal"> / Aadhar Card</span>
                </label>
                <label className="block cursor-pointer border-2 border-dashed border-border-light rounded-2xl p-4 text-center hover:border-primary-orange transition-colors">
                  <Upload size={24} className="text-gray-400 mx-auto mb-1" />
                  <p className="text-text-secondary text-sm">Upload Aadhar Card Image</p>
                  <input type="file" accept="image/*" className="hidden" aria-label="Upload Aadhar card" />
                </label>
              </div>

              {/* Subscription Notice */}
              <div className="bg-accent-yellow/20 border-2 border-accent-yellow rounded-2xl p-4">
                <p className="font-black text-text-primary text-lg mb-1">₹199/month</p>
                <p
                  className="text-text-secondary text-sm"
                  style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                >
                  आपकी subscription Admin approval के बाद start होगी।
                </p>
                <p className="text-text-secondary text-xs">Your subscription starts after admin approval.</p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="flex-1 border-2 border-border-light text-text-secondary font-bold py-4 rounded-2xl hover:border-gray-400 transition-colors">
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="flex-2 flex-1 bg-primary-green text-white font-black text-lg py-4 rounded-2xl hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Submit हो रहा है..." : (
                    <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>Submit करें / Submit</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
