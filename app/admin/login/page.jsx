"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
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
      setError("Username और Password जरूरी है / Username and password required");
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
        localStorage.setItem("kaamsetu_admin_token", data.token);
        router.push("/admin");
      } else if (res.status === 401) {
        setError("गलत username या password / Wrong username or password");
      } else {
        setError(data.message || "Login failed. Please try again.");
      }
    } catch {
      setError("इंटरनेट कनेक्शन चेक करें / Please check your internet connection");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-navy flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-navy rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
            🔐
          </div>
          <h1 className="text-2xl font-bold text-gray-900">KaamSetu Admin</h1>
          <p className="text-gray-500 mt-1 text-sm">Authorized Access Only</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Admin username"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand-navy text-base"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand-navy text-base pr-20"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "🙈 Hide" : "👁 Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-navy text-white font-bold py-4 rounded-xl text-base hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "⟳ Logging in..." : "🔓 Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
