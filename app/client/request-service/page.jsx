"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileInput from "@/components/MobileInput";
import OTPInput from "@/components/OTPInput";
import CategorySelect from "@/components/CategorySelect";
import LocationPicker from "@/components/LocationPicker";
import { createJobRequest } from "@/lib/api/jobs";

function RequestForm() {
  const searchParams = useSearchParams();
  const preCategory = searchParams.get("category") || "";

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [category, setCategory] = useState(preCategory);
  const [subcategory, setSubcategory] = useState("");
  const [location, setLocation] = useState("");
  const [stage, setStage] = useState("form"); // "form" | "searching" | "success"
  const [searchProgress, setSearchProgress] = useState(0);

  const { register, handleSubmit, formState: { errors } } = useForm();

  async function onSubmit(data) {
    if (!mobileVerified) return;
    setStage("searching");
    // Animate progress 0→100 over 5 seconds
    let p = 0;
    const interval = setInterval(() => {
      p += 4;
      setSearchProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(interval);
        setStage("success");
      }
    }, 200);
    // Fire API (result unused for now)
    createJobRequest({ ...data, mobile, category, subcategory, location });
  }

  if (stage === "searching") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-24 h-24 bg-primary-orange rounded-full flex items-center justify-center mb-6 animate-pulse">
          <Loader2 size={48} className="text-white animate-spin" />
        </div>
        <h2 className="text-2xl font-black text-text-primary mb-2 text-center" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
          नज़दीकी वर्कर ढूंढ रहे हैं...
        </h2>
        <p className="text-text-secondary mb-6 text-center">Searching nearby workers...</p>
        <div className="w-full max-w-xs bg-gray-100 rounded-full h-4 overflow-hidden">
          <div
            className="h-4 bg-primary-orange rounded-full transition-all duration-200"
            style={{ width: `${searchProgress}%` }}
          />
        </div>
        <p className="text-primary-orange font-bold mt-2">{searchProgress}%</p>
      </div>
    );
  }

  if (stage === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <CheckCircle size={72} className="text-primary-green mb-4" />
        <h2 className="text-2xl font-black text-text-primary mb-3" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
          ✅ Request Send हो गई!
        </h2>
        <p className="text-text-secondary mb-2" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
          पहला worker accept करते ही आपको call आएगी।
        </p>
        <p className="text-text-secondary text-sm mb-8">First available worker will call you right away!</p>
        <div className="flex gap-3 flex-col sm:flex-row w-full max-w-xs">
          <Link href="/" className="flex-1 text-center bg-primary-navy text-white font-bold py-4 rounded-2xl hover:bg-blue-900 transition-colors">
            Home / होम
          </Link>
          <button onClick={() => { setStage("form"); setSearchProgress(0); }} className="flex-1 border-2 border-primary-orange text-primary-orange font-bold py-4 rounded-2xl hover:bg-orange-50 transition-colors">
            New Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Name */}
      <div>
        <label className="block mb-1.5 font-semibold">
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>नाम</span>
          <span className="text-text-secondary font-normal"> / Name *</span>
        </label>
        <input
          {...register("name", { required: "नाम जरूरी है" })}
          placeholder="आपका नाम / Your Name"
          className="w-full px-4 py-4 text-base border-2 border-border-light rounded-xl focus:outline-none focus:border-primary-orange"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>

      {/* Mobile + OTP */}
      <div>
        <label className="block mb-1.5 font-semibold">
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>मोबाइल</span>
          <span className="text-text-secondary font-normal"> / Mobile *</span>
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
            <button type="button" onClick={() => otp.length === 6 && setMobileVerified(true)} className="w-full bg-primary-blue text-white font-bold py-2 rounded-xl text-sm">Verify OTP</button>
            <p className="text-xs text-center text-text-secondary">(Demo: any 6 digits)</p>
          </div>
        )}
        {mobileVerified && <p className="text-primary-green text-sm mt-1 font-semibold">✓ Verified!</p>}
      </div>

      {/* Category */}
      <CategorySelect
        value={category}
        onChange={setCategory}
        level="main"
        label="Category"
        labelEn="Service Category *"
      />

      {/* Subcategory */}
      {category && category !== "__other__" && (
        <CategorySelect
          value={subcategory}
          onChange={setSubcategory}
          level="sub"
          parentSlug={category}
          label="Subcategory"
          labelEn="Specific Service"
        />
      )}

      {/* Location */}
      <div>
        <label className="block mb-1.5 font-semibold">
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>लोकेशन</span>
          <span className="text-text-secondary font-normal"> / Location *</span>
        </label>
        <LocationPicker value={location} onChange={setLocation} />
      </div>

      {/* When */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block mb-1.5 font-semibold text-sm">
            <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>कब?</span>
            <span className="text-text-secondary font-normal"> / Date</span>
          </label>
          <input
            {...register("date")}
            type="date"
            className="w-full px-4 py-4 text-base border-2 border-border-light rounded-xl focus:outline-none focus:border-primary-orange"
          />
        </div>
        <div>
          <label className="block mb-1.5 font-semibold text-sm">
            <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>समय</span>
            <span className="text-text-secondary font-normal"> / Time</span>
          </label>
          <input
            {...register("time")}
            type="time"
            className="w-full px-4 py-4 text-base border-2 border-border-light rounded-xl focus:outline-none focus:border-primary-orange"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block mb-1.5 font-semibold">
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>नोट्स</span>
          <span className="text-text-secondary font-normal"> / Additional Notes (optional)</span>
        </label>
        <textarea
          {...register("notes")}
          rows={3}
          placeholder="कोई विशेष जानकारी / Any special requirements..."
          className="w-full px-4 py-4 text-base border-2 border-border-light rounded-xl focus:outline-none focus:border-primary-orange resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={!mobileVerified || !category}
        className="w-full bg-primary-orange text-white font-black text-xl py-5 rounded-2xl hover:bg-orange-600 transition-colors disabled:opacity-50 min-h-16"
        aria-label="Submit service request"
      >
        <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>Worker ढूंढें</span>
        <span className="block text-sm font-normal">/ Find Worker</span>
      </button>
    </form>
  );
}

export default function RequestServicePage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-neutral-bg">
        <div className="bg-primary-orange px-4 py-6">
          <div className="max-w-lg mx-auto">
            <Link href="/" className="text-white/70 hover:text-white flex items-center gap-2 mb-3 w-fit" aria-label="Back">
              <ArrowLeft size={20} />
              <span className="text-sm">Back / वापस</span>
            </Link>
            <h1
              className="text-2xl md:text-3xl font-black text-white"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              काम करवाओ
            </h1>
            <p className="text-white/80">Hire a Worker — Fast!</p>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl border-2 border-border-light p-6 shadow-lg">
            <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
              <RequestForm />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
