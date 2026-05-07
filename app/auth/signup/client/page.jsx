"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wrench } from "lucide-react";
import { useForm } from "react-hook-form";
import { signupClient } from "@/lib/api/auth";
import OTPVerification from "@/components/OTPVerification";
import useFormSubmit from "@/lib/hooks/useFormSubmit";
import { useToast } from "@/components/Toast";

export default function ClientSignupPage() {
  const router = useRouter();
  const toast = useToast();
  const [verifiedData, setVerifiedData] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const { submit, isSubmitting } = useFormSubmit({
    onSubmit: async (data) => {
      return await signupClient({
        name: data.name,
        mobile: verifiedData.mobile,
        otpToken: verifiedData.token,
      });
    },
    onSuccess: (result) => {
      if (typeof window !== "undefined" && result?.token) {
        localStorage.setItem("kaamsetu_token", result.token);
        if (result?.user) localStorage.setItem("kaamsetu_user", JSON.stringify(result.user));
      }
      toast.success("Registration हो गई! / Registration successful!");
      router.push("/client/dashboard");
    },
    onError: (message) => {
      if (message.includes("already registered")) {
        toast.error(
          <>
            {message}{" "}
            <Link href="/auth/login" className="underline font-bold">Login करें / Login</Link>
          </>
        );
      } else {
        toast.error(message);
      }
    },
  });

  async function onSubmit(data) {
    if (!verifiedData) {
      toast.error("पहले मोबाइल verify करें / Please verify your mobile first");
      return;
    }
    try {
      await submit(data);
    } catch {
      // error shown via toast
    }
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
          <h1 className="text-2xl font-black text-text-primary mb-1 text-center"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            Client Registration
          </h1>
          <p className="text-text-secondary text-sm text-center mb-6">Quick sign up — 2 minutes!</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Name */}
            <div>
              <label className="block mb-1.5 font-semibold">
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>नाम</span>
                <span className="text-text-secondary font-normal"> / Name *</span>
              </label>
              <input
                {...register("name", {
                  required: "नाम जरूरी है / Name is required",
                  minLength: { value: 2, message: "नाम कम से कम 2 अक्षर का हो / Min 2 characters" },
                })}
                type="text"
                placeholder="आपका नाम / Your Name"
                disabled={isSubmitting}
                className="w-full px-4 py-4 text-base border-2 border-border-light rounded-xl focus:outline-none focus:border-primary-orange disabled:opacity-60"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* Mobile + OTP */}
            <div>
              <label className="block mb-1.5 font-semibold">
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>मोबाइल</span>
                <span className="text-text-secondary font-normal"> / Mobile *</span>
              </label>
              {verifiedData ? (
                <p className="text-primary-green text-sm font-semibold">✓ +91 {verifiedData.mobile} verified</p>
              ) : (
                <OTPVerification
                  mode="signup"
                  onSuccess={(data) => setVerifiedData(data)}
                  onError={(msg) => toast.error(msg)}
                  buttonText="मोबाइल वेरीफाई करें / Verify Mobile"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !verifiedData}
              className="w-full bg-primary-orange text-white font-black text-lg py-4 rounded-2xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-14"
            >
              {isSubmitting
                ? "Register हो रहा है... / Registering..."
                : "Register करें / Sign Up"}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-4">
            <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>पहले से account है?</span>{" "}
            <Link href="/auth/login" className="text-primary-blue font-semibold hover:underline">
              Login करें / Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
