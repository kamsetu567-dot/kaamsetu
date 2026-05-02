"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wrench, ArrowLeft, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { sendOTP, loginWithOTP } from "@/lib/api/auth";
import MobileInput from "@/components/MobileInput";
import OTPInput from "@/components/OTPInput";

export default function LoginPage() {
  const [step, setStep] = useState("mobile"); // "mobile" | "otp" | "success"
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  async function handleSendOTP(e) {
    e.preventDefault();
    if (mobile.length !== 10) { setError("कृपया 10 अंकों का मोबाइल नंबर दर्ज करें / Please enter a 10-digit mobile number"); return; }
    setError("");
    setLoading(true);
    await sendOTP(mobile);
    setLoading(false);
    setStep("otp");
  }

  async function handleVerifyOTP(e) {
    e.preventDefault();
    if (otp.length !== 6) { setError("6 अंकों का OTP दर्ज करें / Enter 6-digit OTP"); return; }
    setError("");
    setLoading(true);
    const res = await loginWithOTP(mobile, otp);
    setLoading(false);
    if (res.success) {
      login({ mobile, role: null, token: res.user?.token });
      setStep("success");
      setTimeout(() => router.push("/"), 1500);
    } else {
      setError("गलत OTP / Invalid OTP. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-neutral-bg flex flex-col">
      {/* Top bar */}
      <div className="bg-primary-navy px-4 py-4 flex items-center gap-3">
        <Link href="/" className="text-white/70 hover:text-white" aria-label="Back to home">
          <ArrowLeft size={24} />
        </Link>
        <div className="flex items-center gap-2">
          <Wrench size={20} className="text-accent-yellow" />
          <span className="font-black text-white text-lg">KAAM<span className="text-accent-yellow">SETU</span></span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm bg-white rounded-3xl border-2 border-border-light p-8 shadow-xl">
          {step === "success" ? (
            <div className="text-center py-4">
              <CheckCircle size={56} className="text-primary-green mx-auto mb-4" />
              <h2
                className="text-2xl font-black text-text-primary mb-2"
                style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
              >
                लॉगिन हो गया!
              </h2>
              <p className="text-text-secondary">Login successful! Redirecting...</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1
                  className="text-2xl font-black text-text-primary mb-1"
                  style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                >
                  लॉगिन करें
                </h1>
                <p className="text-text-secondary text-sm">Login to KaamSetu</p>
              </div>

              {step === "mobile" && (
                <form onSubmit={handleSendOTP} className="space-y-5">
                  <div>
                    <label className="block mb-2 font-semibold text-text-primary">
                      <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>मोबाइल नंबर</span>
                      <span className="text-text-secondary font-normal"> / Mobile Number</span>
                    </label>
                    <MobileInput value={mobile} onChange={setMobile} error={error} />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary-orange text-white font-black text-lg py-4 rounded-2xl hover:bg-orange-600 transition-colors disabled:opacity-50 min-h-14"
                    aria-label="Send OTP"
                  >
                    {loading ? "भेज रहे हैं..." : (
                      <>
                        <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>OTP भेजें</span>
                        <span className="text-sm font-normal block">/ Send OTP</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {step === "otp" && (
                <form onSubmit={handleVerifyOTP} className="space-y-5">
                  <div className="text-center mb-4">
                    <p
                      className="text-text-secondary text-sm"
                      style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                    >
                      +91 {mobile} पर OTP भेजा गया
                    </p>
                    <button type="button" onClick={() => setStep("mobile")} className="text-primary-blue text-sm underline mt-1">
                      Change number / नंबर बदलें
                    </button>
                  </div>
                  <OTPInput value={otp} onChange={setOtp} />
                  {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                  <p className="text-xs text-center text-text-secondary">
                    (Demo: any 6-digit OTP works / कोई भी 6 अंक डालें)
                  </p>
                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full bg-primary-orange text-white font-black text-lg py-4 rounded-2xl hover:bg-orange-600 transition-colors disabled:opacity-50 min-h-14"
                    aria-label="Verify OTP"
                  >
                    {loading ? "Verify हो रहा है..." : (
                      <>
                        <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>OTP Verify करें</span>
                        <span className="text-sm font-normal block">/ Verify OTP</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              <p className="text-center text-sm text-text-secondary mt-6">
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>Account नहीं है?</span>
                {" "}
                <Link href="/auth/signup" className="text-primary-blue font-semibold hover:underline">
                  <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>साइनअप करें</span>
                  <span> / Sign Up</span>
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
