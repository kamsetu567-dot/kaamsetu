"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Star, CreditCard, Briefcase, LogOut, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function WorkerDashboardOverview() {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [worker, setWorker] = useState(null);
  const [status, setStatus] = useState("free");
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("kaamsetu_token");
    const userData = localStorage.getItem("kaamsetu_user");
    if (!token || !userData) { router.replace("/auth/login"); return; }
    try {
      const parsed = JSON.parse(userData);
      if (parsed.role !== "worker") {
        if (parsed.role === "client") router.replace("/client/dashboard");
        else if (parsed.role === "shop") router.replace("/shop/dashboard");
        else router.replace("/auth/login");
        return;
      }
      setUser(parsed);
    } catch { router.replace("/auth/login"); return; }

    async function loadWorker() {
      try {
        const res = await fetch("/api/workers/me", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success && data.worker) {
          setWorker(data.worker);
          setStatus(data.worker.workStatus || "free");
        }
      } catch (err) { console.error("Failed to load worker profile:", err); }
    }
    loadWorker();
  }, []);

  async function toggleStatus() {
    if (statusLoading) return;
    const newStatus = status === "free" ? "working" : "free";
    setStatusLoading(true);
    try {
      const token = localStorage.getItem("kaamsetu_token");
      const res = await fetch("/api/workers/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ workStatus: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        toast.success(newStatus === "working" ? "काम शुरू हो गया!" : "काम खत्म हो गया!");
      }
    } catch { toast.error("Status update failed"); }
    finally { setStatusLoading(false); }
  }

  function handleLogout() {
    localStorage.removeItem("kaamsetu_token");
    localStorage.removeItem("kaamsetu_user");
    router.push("/");
  }

  if (!user) return null;

  const isFree = status === "free";

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div className="bg-brand-navy rounded-3xl p-6 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-black text-white font-hindi mb-0.5">
            नमस्ते, {worker?.name || user?.name || "Worker"} 👋
          </h2>
          <p className="text-white/50 text-sm">+91 {user?.mobile}</p>
        </div>
        <button onClick={handleLogout} className="text-white/40 hover:text-white flex items-center gap-1 text-xs min-h-0">
          <LogOut size={14} /> Logout
        </button>
      </div>

      {/* Work Status */}
      <div className={`rounded-3xl border-2 p-6 ${isFree ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}>
        <h3 className="font-black text-brand-navy text-lg font-hindi mb-4">काम की स्थिति</h3>
        <div className={`rounded-2xl p-4 mb-5 text-center ${isFree ? "bg-green-100" : "bg-orange-100"}`}>
          <p className="text-4xl mb-1">{isFree ? "🟢" : "🔴"}</p>
          <p className={`text-xl font-black font-hindi ${isFree ? "text-green-700" : "text-orange-700"}`}>
            {isFree ? "खाली हूँ / Free" : "काम पर हूँ / Working"}
          </p>
        </div>
        <button onClick={toggleStatus} disabled={statusLoading || !worker}
          className={`w-full font-bold py-4 rounded-2xl transition-colors disabled:opacity-50 font-hindi ${
            isFree ? "bg-green-600 text-white hover:bg-green-700" : "bg-red-500 text-white hover:bg-red-600"
          }`}>
          {statusLoading ? "⏳ अपडेट हो रहा है..." : isFree ? "काम पर जाएं / Start Work" : "काम खत्म / End Work"}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Jobs", value: worker?.totalJobs ?? "—", icon: Briefcase, bg: "bg-blue-50", color: "text-brand-navy" },
          { label: "Rating", value: worker?.rating ? worker.rating.toFixed(1) : "New", icon: Star, bg: "bg-yellow-50", color: "text-amber-600" },
          {
            label: "Subscription",
            value: worker?.subscriptionExpiry && new Date(worker.subscriptionExpiry) > new Date()
              ? `${Math.ceil((new Date(worker.subscriptionExpiry) - new Date()) / 86400000)}d left`
              : "Expired",
            icon: CreditCard,
            bg: "bg-purple-50",
            color: worker?.subscriptionExpiry && new Date(worker.subscriptionExpiry) > new Date() ? "text-green-600" : "text-red-500",
          },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 flex flex-col items-center text-center`}>
            <s.icon size={20} className={`${s.color} mb-2`} />
            <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 font-hindi leading-tight mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Profile Summary */}
      <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-black text-brand-navy font-hindi">Profile</h3>
          <Link href="/worker/dashboard/profile" className="text-brand-navy text-sm font-semibold hover:underline">Edit →</Link>
        </div>
        <div className="flex gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 border-2 border-gray-200">
            {worker?.photo ? (
              <img src={worker.photo} alt="Profile" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User size={28} className="text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-black text-brand-navy">{worker?.name || "—"}</p>
            <p className="text-gray-400 text-sm">{worker?.category || "No category set"}</p>
            <p className="text-gray-400 text-xs mt-0.5">📍 {worker?.location?.city || "—"}</p>
          </div>
        </div>
        {worker?.isApproved && (
          <div className="mt-3 flex items-center gap-1 text-green-600 text-xs font-semibold">
            <CheckCircle size={14} /> Verified Worker
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-black text-brand-navy font-hindi mb-4">Quick Links</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: "/worker/dashboard/jobs", label: "Incoming Jobs", sub: "New notifications", icon: Briefcase, bg: "bg-brand-navy" },
            { href: "/worker/dashboard/subscription", label: "Subscription", sub: "₹199/month", icon: CreditCard, bg: "bg-green-600" },
            { href: "/worker/dashboard/profile", label: "Edit Profile", sub: "Update details", icon: User, bg: "bg-amber-500" },
            { href: "/worker/dashboard/referrals", label: "Referrals", sub: "Earn ₹20–₹50", icon: Star, bg: "bg-purple-600" },
          ].map(link => (
            <Link key={link.href} href={link.href}
              className={`${link.bg} text-white rounded-2xl p-4 flex flex-col gap-2 hover:opacity-90 transition-opacity`}>
              <link.icon size={20} />
              <div>
                <p className="font-bold text-sm">{link.label}</p>
                <p className="text-xs opacity-70">{link.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
