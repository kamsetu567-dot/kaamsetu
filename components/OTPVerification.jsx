"use client";

// TODO: Replace with real OTP before going live
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/components/Toast";

export default function OTPVerification({
  onSuccess,
  onError,
  buttonText = "OTP भेजें / Send OTP",
  mode = "login",
}) {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  function startResendTimer() {
    setResendTimer(30);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSendOTP(e) {
    console.log('Send OTP clicked, mobile:', mobile);
    e.preventDefault();
    if (!/^\d{10}$/.test(mobile)) {
      toast.error("10 अंकों का मोबाइल नंबर डालें / Enter 10 digit mobile number");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const data = await res.json();
      if (data.success) {
        setStep(2);
        startResendTimer();
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        toast.error(data.message || "OTP भेजने में error / Failed to send OTP");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index, value) {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      toast.error("6 अंकों का OTP डालें / Enter 6 digit OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp: otpValue, mode }),
      });
      const data = await res.json();
      if (data.success) {
        setIsVerified(true);
        if (typeof window !== "undefined" && data.token) {
          localStorage.setItem("kaamsetu_token", data.token);
        }
        onSuccess?.(data);
      } else {
        const msg = data.message || "OTP verify नहीं हुई / OTP verification failed";
        toast.error(msg);
        onError?.(msg);
      }
    } catch {
      const msg = "Server error. Please try again.";
      toast.error(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const data = await res.json();
      if (data.success) {
        setOtp(["", "", "", "", "", ""]);
        startResendTimer();
        toast.success("OTP दोबारा भेज दिया / OTP resent");
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (isVerified) {
    return (
      <div className="flex items-center gap-2 text-primary-green font-semibold py-3">
        <span className="text-xl">✅</span>
        <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
          मोबाइल वेरीफाई हो गया / Mobile Verified
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {step === 1 ? (
        <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
          <div className="flex gap-2">
            <div className="flex items-center bg-gray-100 border-2 border-border-light rounded-xl px-3 font-semibold text-text-secondary text-sm flex-shrink-0">
              +91
            </div>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="मोबाइल नंबर / Mobile number"
              className="flex-1 px-4 py-4 text-base border-2 border-border-light rounded-xl focus:outline-none focus:border-primary-orange"
            />
          </div>
          <button
            type="button"
            onClick={handleSendOTP}
            disabled={loading}
            className="w-full bg-primary-navy text-white font-black text-lg py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-blue-900 transition-colors disabled:opacity-50 min-h-14"
          >
            {loading ? (
              <>
                <span className="animate-spin text-xl">⏳</span>
                <span>भेज रहे हैं... / Sending...</span>
              </>
            ) : (
              <>
                <span>📱</span>
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{buttonText}</span>
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          <p className="text-text-secondary text-sm text-center">
            OTP भेजा गया /{" "}
            <span className="font-bold text-text-primary">+91{mobile}</span> पर OTP sent
          </p>
          <div className="flex gap-2 justify-center">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="w-11 h-14 text-center text-xl font-bold border-2 border-border-light rounded-xl focus:outline-none focus:border-primary-orange"
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-navy text-white font-black text-lg py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-blue-900 transition-colors disabled:opacity-50 min-h-14"
          >
            {loading ? (
              <>
                <span className="animate-spin text-xl">⏳</span>
                <span>Verify हो रहा है...</span>
              </>
            ) : (
              <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
                Verify करें / Verify
              </span>
            )}
          </button>
          <div className="text-center">
            {resendTimer > 0 ? (
              <p className="text-text-secondary text-xs">
                {resendTimer}s में Resend कर सकते हैं / Resend available in {resendTimer}s
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="text-primary-blue text-sm font-semibold hover:underline"
              >
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
                  दोबारा भेजें / Resend
                </span>
              </button>
            )}
          </div>
        </form>
      )}

      {/* TODO: Replace with real OTP before going live */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 text-center">
        <p className="text-yellow-700 text-xs font-medium">
          ⚠️ Testing mode: Use OTP 123456 / टेस्टिंग मोड: OTP 123456 डालें
        </p>
      </div>
    </div>
  );
}
