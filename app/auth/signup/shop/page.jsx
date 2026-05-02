"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Upload, Wrench } from "lucide-react";
import { useForm } from "react-hook-form";
import { signupShop } from "@/lib/api/auth";
import MobileInput from "@/components/MobileInput";
import OTPInput from "@/components/OTPInput";
import CategorySelect from "@/components/CategorySelect";

export default function ShopSignupPage() {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [category, setCategory] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  async function onSubmit(data) {
    if (!mobileVerified) return;
    setLoading(true);
    await signupShop({ ...data, mobile, category });
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-neutral-bg flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border-2 border-border-light p-10 text-center max-w-sm w-full shadow-xl">
          <CheckCircle size={64} className="text-primary-green mx-auto mb-4" />
          <h2 className="text-2xl font-black text-text-primary mb-2" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            Shop Registration हो गई!
          </h2>
          <p className="text-text-secondary mb-6">Admin approval के बाद आपकी shop live होगी।</p>
          <Link href="/" className="block bg-primary-navy text-white font-bold py-4 rounded-2xl hover:bg-blue-900 transition-colors">
            Home पर जाएं / Go Home
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
          <span className="font-black text-white text-lg">Shop / दुकान Registration</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-3xl border-2 border-border-light p-8 shadow-xl">
          <h1 className="text-2xl font-black text-text-primary mb-1" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            दुकान / Shop Registration
          </h1>
          <p className="text-text-secondary text-sm mb-6">Register your shop on KaamSetu</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block mb-1.5 font-semibold">
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>दुकान का नाम</span>
                <span className="text-text-secondary font-normal"> / Shop Name *</span>
              </label>
              <input
                {...register("shopName", { required: "Shop name is required" })}
                placeholder="Shop / Business Name"
                className="w-full px-4 py-4 text-base border-2 border-border-light rounded-xl focus:outline-none focus:border-primary-orange"
              />
              {errors.shopName && <p className="text-red-500 text-sm mt-1">{errors.shopName.message}</p>}
            </div>

            <div>
              <label className="block mb-1.5 font-semibold">
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>मालिक का नाम</span>
                <span className="text-text-secondary font-normal"> / Owner Name *</span>
              </label>
              <input
                {...register("ownerName", { required: "Owner name is required" })}
                placeholder="Owner Full Name"
                className="w-full px-4 py-4 text-base border-2 border-border-light rounded-xl focus:outline-none focus:border-primary-orange"
              />
              {errors.ownerName && <p className="text-red-500 text-sm mt-1">{errors.ownerName.message}</p>}
            </div>

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
                  <button type="button" onClick={() => otp.length === 6 && setMobileVerified(true)} className="w-full bg-primary-blue text-white font-bold py-2 rounded-xl text-sm">
                    Verify
                  </button>
                  <p className="text-xs text-center text-text-secondary">(Demo: any 6 digits)</p>
                </div>
              )}
              {mobileVerified && <p className="text-primary-green text-sm mt-1 font-semibold">✓ Verified!</p>}
            </div>

            <CategorySelect
              value={category}
              onChange={setCategory}
              level="main"
              label="Category"
              labelEn="Shop Category"
            />

            <div>
              <label className="block mb-1.5 font-semibold">
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>लोकेशन</span>
                <span className="text-text-secondary font-normal"> / Location</span>
              </label>
              <input
                {...register("location")}
                placeholder="City, Area"
                className="w-full px-4 py-4 text-base border-2 border-border-light rounded-xl focus:outline-none focus:border-primary-orange"
              />
            </div>

            {/* Shop Photo Upload */}
            <div>
              <label className="block mb-1.5 font-semibold">
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>दुकान की फ़ोटो</span>
                <span className="text-text-secondary font-normal"> / Shop Photo</span>
              </label>
              <label className="block cursor-pointer border-2 border-dashed border-border-light rounded-2xl p-4 text-center hover:border-primary-orange transition-colors">
                <Upload size={24} className="text-gray-400 mx-auto mb-1" />
                <p className="text-text-secondary text-sm">Upload Shop Photo</p>
                <input type="file" accept="image/*" className="hidden" aria-label="Upload shop photo" />
              </label>
            </div>

            {/* Aadhar */}
            <div>
              <label className="block mb-1.5 font-semibold">
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>आधार कार्ड</span>
                <span className="text-text-secondary font-normal"> / Aadhar Card</span>
              </label>
              <label className="block cursor-pointer border-2 border-dashed border-border-light rounded-2xl p-4 text-center hover:border-primary-orange transition-colors">
                <Upload size={24} className="text-gray-400 mx-auto mb-1" />
                <p className="text-text-secondary text-sm">Upload Aadhar Card</p>
                <input type="file" accept="image/*" className="hidden" aria-label="Upload Aadhar" />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !mobileVerified}
              className="w-full bg-primary-navy text-white font-black text-lg py-4 rounded-2xl hover:bg-blue-900 transition-colors disabled:opacity-50 min-h-14"
            >
              {loading ? "Register हो रहा है..." : (
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>Register करें / Register</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
