"use client";

import { useState, useEffect, useRef } from "react";

const SCRIPT_SRC = "https://control.msg91.com/app/assets/otp-provider/otp-provider.js";

export default function OTPVerification({
  onSuccess,
  onError,
  buttonText = "मोबाइल वेरीफाई करें / Verify Mobile",
  mode = "login",
}) {
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const pollRef = useRef(null);

  const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID;
  const tokenAuth = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH;

  useEffect(() => {
    if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }

    const deadline = Date.now() + 15_000;

    pollRef.current = setInterval(() => {
      if (window.initSendOTP) {
        clearInterval(pollRef.current);
        setIsScriptReady(true);
      } else if (Date.now() >= deadline) {
        clearInterval(pollRef.current);
        setScriptError(true);
      }
    }, 300);

    return () => clearInterval(pollRef.current);
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
            onError?.(result.message || "Verification failed");
          }
        } catch {
          onError?.("Server error. Please try again.");
        }
      },
      failure: (err) => {
        const isEmpty = !err || Object.keys(err).length === 0;
        if (isEmpty) return;
        console.error("MSG91 widget error:", err);
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

  if (scriptError) {
    return (
      <div className="w-full bg-red-50 border-2 border-red-200 text-red-600 font-semibold text-sm py-4 px-6 rounded-2xl text-center">
        OTP service unavailable. Please refresh.
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={initializeWidget}
      disabled={!isScriptReady}
      className="w-full bg-primary-navy text-white font-black text-lg py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-14"
    >
      {!isScriptReady ? (
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
