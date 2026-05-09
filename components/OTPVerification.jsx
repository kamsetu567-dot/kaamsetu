"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/Toast";

const SCRIPT_SRC = "https://control.msg91.com/app/assets/otp-provider/otp-provider.js";

export default function OTPVerification({
  onSuccess,
  onError,
  buttonText = "मोबाइल वेरीफाई करें / Verify Mobile",
  mode = "login",
}) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID;
  const tokenAuth = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH;

  useEffect(() => {
    if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  function initializeWidget() {
    const configuration = {
      widgetId,
      tokenAuth,
      exposeMethods: false,
      environment: "production",
      success: async (data) => {
        const accessToken = data?.message || data?.access_token || data;

        if (!accessToken) {
          setIsLoading(false);
          onError?.("OTP verification failed. Please try again.");
          return;
        }

        try {
          const response = await fetch("/api/auth/verify-otp-widget", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accessToken, mode }),
          });
          const result = await response.json();

          if (result.success) {
            setIsVerified(true);
            if (typeof window !== "undefined" && result.token) {
              localStorage.setItem("kaamsetu_token", result.token);
            }
            onSuccess?.(result);
          } else {
            setIsLoading(false);
            onError?.(result.message || "Verification failed");
          }
        } catch {
          setIsLoading(false);
          onError?.("Server error. Please try again.");
        }
      },
      failure: (err) => {
        const isEmpty = !err || Object.keys(err).length === 0;
        if (isEmpty) { setIsLoading(false); return; }
        console.error("MSG91 widget error:", err);
        setIsLoading(false);
        onError?.("OTP verification failed. Please try again.");
      },
    };

    console.log("Widget config:", configuration);
    console.log("initSendOTP available:", !!window.initSendOTP);
    if (window.sendOTPObj) { try { window.sendOTPObj = null; } catch(e) {} }
    try {
      window.initSendOTP(configuration);
    } catch (err) {
      console.error("initSendOTP threw an error:", err);
      setIsLoading(false);
    }
  }

  function handleClick() {
    if (!window.initSendOTP) {
      toast.error("OTP service not available. Please refresh the page / OTP सेवा उपलब्ध नहीं। Page refresh करें");
      return;
    }
    setIsLoading(true);
    initializeWidget();
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
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className="w-full bg-primary-navy text-white font-black text-lg py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-14"
    >
      {isLoading ? (
        <>
          <span className="animate-spin text-xl">⏳</span>
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            लोड हो रहा है... / Loading...
          </span>
        </>
      ) : (
        <>
          <span>📱</span>
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{buttonText}</span>
        </>
      )}
    </button>
  );
}
