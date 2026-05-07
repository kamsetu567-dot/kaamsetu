"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wrench } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import OTPVerification from "@/components/OTPVerification";
import { useToast } from "@/components/Toast";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const toast = useToast();

  function handleSuccess(data) {
    if (typeof window !== "undefined") {
      localStorage.setItem("kaamsetu_token", data.token);
      localStorage.setItem("kaamsetu_user", JSON.stringify(data.user));
    }
    login({ mobile: data.mobile, role: data.user?.role, token: data.token });

    const role = data.user?.role;
    if (role === "admin") router.push("/admin");
    else if (role === "worker") router.push("/worker/dashboard");
    else if (role === "shop") router.push("/shop/dashboard");
    else if (data.isNewUser) router.push("/auth/signup");
    else router.push("/client/dashboard");
  }

  function handleError(message) {
    if (message?.includes("Account does not exist") || message?.includes("Account exists नहीं")) {
      toast.error("Account नहीं मिला। पहले sign up करें / Account not found. Please sign up first");
      setTimeout(() => router.push("/auth/signup"), 2000);
    } else {
      toast.error(message);
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
          <div className="text-center mb-8">
            <h1
              className="text-2xl font-black text-text-primary mb-1"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              लॉगिन करें
            </h1>
            <p className="text-text-secondary text-sm">Login to KaamSetu</p>
          </div>

          {/* How it works */}
          <div className="bg-blue-50 rounded-2xl p-4 mb-6 text-sm text-blue-800">
            <p className="font-semibold mb-1" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
              📱 मोबाइल से लॉगिन करें
            </p>
            <p style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
              नीचे बटन दबाएं → मोबाइल नंबर डालें → OTP डालें → Done!
            </p>
            <p className="text-xs mt-1 text-blue-600">
              Tap button → Enter mobile → Enter OTP → Done!
            </p>
          </div>

          <OTPVerification
            onSuccess={handleSuccess}
            onError={handleError}
            buttonText="मोबाइल से लॉगिन करें / Login with Mobile"
          />

          <p className="text-center text-sm text-text-secondary mt-6">
            <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>Account नहीं है?</span>
            {" "}
            <Link href="/auth/signup" className="text-primary-blue font-semibold hover:underline">
              <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>साइनअप करें</span>
              <span> / Sign Up</span>
            </Link>
          </p>

          <p className="text-center text-xs text-text-secondary mt-4">
            लॉगिन करने पर आप हमारी{" "}
            <Link href="/terms" className="underline">Terms</Link> &{" "}
            <Link href="/privacy" className="underline">Privacy Policy</Link>{" "}
            से सहमत हैं
          </p>
        </div>
      </div>
    </div>
  );
}
