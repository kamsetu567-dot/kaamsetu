"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useT } from "@/lib/i18n/useT";
import { clearImpersonationState } from "@/lib/utils/impersonation";

export default function AdminLoginPage() {
  const router = useRouter();
  const t = useT();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    if (isLoading) return; // prevent double submit
    setError("");
    if (!username.trim() || !password.trim()) {
      setError(t({ hi: 'Username और Password जरूरी है', en: 'Username and password required' }));
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        // A fresh admin session must never inherit an abandoned impersonation
        // stash — its Exit would restore the stale token over this new one.
        clearImpersonationState();
        localStorage.setItem("kaamsetu_admin_token", data.token);
        router.push("/admin");
      } else if (res.status === 401) {
        setError(t({ hi: 'गलत username या password', en: 'Wrong username or password' }));
      } else {
        setError(data.message || t({ hi: 'Login नहीं हो पाया, फिर से try करें', en: 'Login failed. Please try again.' }));
      }
    } catch {
      setError(t({ hi: 'इंटरनेट कनेक्शन चेक करें', en: 'Please check your internet connection' }));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-navy flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-navy rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden p-2">
            <Image
              src="/logo.png"
              alt="KaamSetu"
              width={48}
              height={48}
              className="w-full h-full object-contain"
              unoptimized
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">KaamSetu {t({ hi: 'एडमिन', en: 'Admin' })}</h1>
          <p className="text-gray-500 mt-1 text-sm">{t({ hi: 'सिर्फ अधिकृत प्रवेश', en: 'Authorized Access Only' })}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t({ hi: 'यूज़रनेम', en: 'Username' })}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t({ hi: 'एडमिन यूज़रनेम', en: 'Admin username' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand-navy text-base"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t({ hi: 'पासवर्ड', en: 'Password' })}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t({ hi: 'एडमिन पासवर्ड', en: 'Admin password' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand-navy text-base pr-20"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
              >
                {showPassword ? `🙈 ${t({ hi: 'छुपाएँ', en: 'Hide' })}` : `👁 ${t({ hi: 'दिखाएँ', en: 'Show' })}`}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-navy text-white font-bold py-4 rounded-xl text-base hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? `⟳ ${t({ hi: 'लॉगिन हो रहा है...', en: 'Logging in...' })}` : `🔓 ${t({ hi: 'लॉगिन', en: 'Login' })}`}
          </button>
        </form>
      </div>
    </div>
  );
}
