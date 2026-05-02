"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Wrench } from "lucide-react";
import { useForm } from "react-hook-form";
import { signupClient } from "@/lib/api/auth";
import MobileInput from "@/components/MobileInput";
import OTPInput from "@/components/OTPInput";

export default function ClientSignupPage() {
  const [mobile, setMobile] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [mobileVerified, setMobileVerified] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  async function handleMobileSubmit() {
    if (mobile.length !== 10) return;
    setOtpStep(true);
  }

  function handleOTPVerify() {
    if (otp.length === 6) setMobileVerified(true);
  }

  async function onSubmit(data) {
    setLoading(true);
    await signupClient({ ...data, mobile });
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-neutral-bg flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-3xl border-2 border-border-light p-10 text-center max-w-sm w-full shadow-xl">
          <CheckCircle size={64} className="text-primary-green mx-auto mb-4" />
          <h2 className="text-2xl font-black text-text-primary mb-2" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            Registration हो गई!
          </h2>
          <p className="text-text-secondary mb-6">Welcome to KaamSetu!</p>
          <Link href="/client/request-service" className="block bg-primary-orange text-white font-bold text-lg py-4 rounded-2xl hover:bg-orange-600 transition-colors">
            <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>काम करवाओ / Hire Now</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-bg flex flex-col">
      <div className="bg-primary-navy px-4 py-4 flex items-center gap-3">
        <Link href="/auth/signup" className="text-white/70 hover:text-white" aria-label="Back">
          <ArrowLeft size={24} />
        </Link>
        <div className="flex items-center gap-2">
          <Wrench size={20} className="text-accent-yellow" />
          <span className="font-black text-white text-lg">KAAM<span className="text-accent-yellow">SETU</span></span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm bg-white rounded-3xl border-2 border-border-light p-8 shadow-xl">
          <h1 className="text-2xl font-black text-text-primary mb-1 text-center" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            Client Registration
          </h1>
          <p className="text-text-secondary text-sm text-center mb-6">Quick sign up — 2 minutes!</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block mb-1.5 font-semibold">
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>नाम</span>
                <span className="text-text-secondary font-normal"> / Name</span>
              </label>
              <input
                {...register("name", { required: "नाम जरूरी है / Name is required" })}
                type="text"
                placeholder="आपका नाम / Your Name"
                className="w-full px-4 py-4 text-base border-2 border-border-light rounded-xl focus:outline-none focus:border-primary-orange"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            {/* Mobile */}
            <div>
              <label className="block mb-1.5 font-semibold">
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>मोबाइल</span>
                <span className="text-text-secondary font-normal"> / Mobile</span>
              </label>
              <MobileInput value={mobile} onChange={setMobile} />
              {!mobileVerified && (
                <button type="button" onClick={handleMobileSubmit} className="mt-2 text-primary-blue text-sm font-semibold">
                  OTP भेजें / Send OTP
                </button>
              )}
              {otpStep && !mobileVerified && (
                <div className="mt-3">
                  <OTPInput value={otp} onChange={setOtp} />
                  <button type="button" onClick={handleOTPVerify} className="mt-2 w-full bg-primary-blue text-white font-bold py-2 rounded-xl">
                    Verify OTP
                  </button>
                  <p className="text-xs text-center text-text-secondary mt-1">(Demo: any 6 digits)</p>
                </div>
              )}
              {mobileVerified && (
                <p className="text-primary-green text-sm mt-1 font-semibold">✓ Mobile Verified!</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !mobileVerified}
              className="w-full bg-primary-orange text-white font-black text-lg py-4 rounded-2xl hover:bg-orange-600 transition-colors disabled:opacity-50 min-h-14"
            >
              <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
                {loading ? "Register हो रहा है..." : "Register करें / Sign Up"}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
