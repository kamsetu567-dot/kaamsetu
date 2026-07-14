"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Star, CreditCard, Briefcase, LogOut, CheckCircle, Clock, Play, Trophy, MapPin, Phone, MessageCircle } from "lucide-react";
import { useToast } from "@/components/Toast";
import SubscriptionCountdown from "@/components/SubscriptionCountdown";
import { getJobHistory } from "@/lib/api/jobs";

export default function WorkerDashboardOverview() {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [worker, setWorker] = useState(null);
  const [status, setStatus] = useState("free");
  const [statusLoading, setStatusLoading] = useState(false);
  const [activeJob, setActiveJob] = useState(null);
  const [jobActionLoading, setJobActionLoading] = useState(null); // "start" | "complete"
  const [startCodeInput, setStartCodeInput] = useState("");
  const [price, setPrice] = useState(199);
  const [locationUpdating, setLocationUpdating] = useState(false);

  useEffect(() => {
    fetch("/api/settings/public")
      .then(r => r.json())
      .then(d => { if (d?.subscriptionPrice) setPrice(d.subscriptionPrice); })
      .catch(() => {});
  }, []);

  async function loadActiveJob(userId) {
    if (!userId) return;
    try {
      const jobs = await getJobHistory(userId);
      const active = jobs.find(j => j.status === "accepted" || j.status === "in_progress");
      setActiveJob(active || null);
    } catch {}
  }

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

    // Load currently active (accepted / in_progress) job so the worker can
    // start or complete it from the dashboard. Without this surface, the
    // worker has no way to mark a job complete after navigating away.
    try {
      const parsedUser = JSON.parse(localStorage.getItem("kaamsetu_user") || "{}");
      if (parsedUser.id) loadActiveJob(parsedUser.id);
    } catch {}
  }, []);

  async function handleStartJob() {
    if (!activeJob || jobActionLoading) return;
    if (startCodeInput.length !== 4) {
      toast.error("Client से मिला 4-अंकों का code डालें / Enter the 4-digit code from the client");
      return;
    }
    setJobActionLoading("start");
    try {
      const token = localStorage.getItem("kaamsetu_token");
      const res = await fetch(`/api/jobs/${activeJob.id}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: startCodeInput }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveJob({ ...activeJob, status: "in_progress" });
        setStartCodeInput("");
        toast.success("काम शुरू हुआ / Work started");
      } else {
        toast.error(data.message || "Could not start job");
      }
    } catch { toast.error("Network error"); }
    finally { setJobActionLoading(null); }
  }

  async function handleCompleteJob() {
    if (!activeJob || jobActionLoading) return;
    setJobActionLoading("complete");
    try {
      const token = localStorage.getItem("kaamsetu_token");
      const res = await fetch(`/api/jobs/${activeJob.id}/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setActiveJob(null);
        toast.success("काम पूरा हुआ / Job completed");
      } else {
        toast.error(data.message || "Could not complete job");
      }
    } catch { toast.error("Network error"); }
    finally { setJobActionLoading(null); }
  }

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
      const data = await res.json();
      if (res.ok) {
        setStatus(newStatus);
        toast.success(newStatus === "working" ? "काम शुरू हो गया!" : "काम खत्म हो गया!");
      } else {
        toast.error(data?.message || "Status update failed");
      }
    } catch { toast.error("Status update failed"); }
    finally { setStatusLoading(false); }
  }

  async function updateLocation() {
    if (locationUpdating) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Browser doesn't support location / लोकेशन support नहीं है");
      return;
    }
    setLocationUpdating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const token = localStorage.getItem("kaamsetu_token");
          const res = await fetch("/api/workers/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ location: { lat: pos.coords.latitude, lng: pos.coords.longitude } }),
          });
          const data = await res.json();
          if (res.ok && data.worker) {
            setWorker(data.worker);
            toast.success("लोकेशन अपडेट हो गई / Location updated");
          } else {
            toast.error(data?.message || "Update failed");
          }
        } catch { toast.error("Network error"); }
        finally { setLocationUpdating(false); }
      },
      (err) => {
        setLocationUpdating(false);
        const msg = err.code === 1
          ? "Browser में location allow करें / Allow location in browser"
          : "लोकेशन नहीं मिली / Could not get your location";
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function handleLogout() {
    localStorage.removeItem("kaamsetu_token");
    localStorage.removeItem("kaamsetu_user");
    router.push("/");
  }

  if (!user) return null;

  const hasCoords = Array.isArray(worker?.location?.coordinates?.coordinates)
    && worker.location.coordinates.coordinates.length === 2;

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

      {/* Missing-CITY banner. Ranked above the GPS one because it's strictly
          worse: jobs are matched by city, so no city means ZERO jobs — whereas
          no GPS just means they aren't sorted by distance. */}
      {worker && !worker.location?.city && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <MapPin size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-black text-red-700 font-hindi">आपका शहर सेट नहीं है — कोई job नहीं दिखेगी</p>
              <p className="text-xs text-red-600 mt-0.5">
                Jobs are matched by city. Until you add yours, you will not receive any.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={updateLocation} disabled={locationUpdating}
              className="flex-1 bg-red-600 text-white text-xs font-bold px-3 py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-60 min-h-0">
              {locationUpdating ? "Updating…" : "Update Location"}
            </button>
            <Link href="/worker/dashboard/profile"
              className="flex-1 text-center border-2 border-red-300 text-red-700 text-xs font-bold px-3 py-2.5 rounded-lg hover:bg-red-100">
              Edit Profile →
            </Link>
          </div>
        </div>
      )}

      {/* Missing-GPS banner — workers without coords still get every job in their
          city, they're just not sorted by distance. Lower priority than the above. */}
      {worker && worker.location?.city && !hasCoords && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 flex items-start gap-3">
          <MapPin size={20} className="text-yellow-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-yellow-900 font-hindi">GPS लोकेशन सेट नहीं है</p>
            <p className="text-xs text-yellow-800 mt-0.5">
              You still get every job in your city — enable GPS to see the nearest ones first.
            </p>
          </div>
          <button onClick={updateLocation} disabled={locationUpdating}
            className="bg-yellow-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-yellow-700 whitespace-nowrap disabled:opacity-60 min-h-0">
            {locationUpdating ? "Updating…" : "Update Location"}
          </button>
        </div>
      )}

      {/* Always-available "Update Location" affordance once coords are set */}
      {worker && hasCoords && (
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span className="flex items-center gap-1.5">
            <MapPin size={12} className="text-green-600" />
            <span>{worker.location?.locality || worker.location?.city || "Location saved"}</span>
          </span>
          <button onClick={updateLocation} disabled={locationUpdating}
            className="text-brand-navy font-semibold hover:underline min-h-0">
            {locationUpdating ? "Updating…" : "Update Location"}
          </button>
        </div>
      )}

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
            isFree ? "bg-red-500 text-white hover:bg-red-600" : "bg-green-600 text-white hover:bg-green-700"
          }`}>
          {statusLoading
            ? "⏳ अपडेट हो रहा है..."
            : isFree
              ? "व्यस्त हो जाएं / Stop new jobs"
              : "उपलब्ध हो जाएं / Start getting jobs"}
        </button>
        <p className="text-xs text-gray-500 mt-2 text-center font-hindi">
          {isFree
            ? "आपको नई jobs मिल रही हैं / You're receiving new jobs"
            : "नई jobs बंद हैं — फिर से चालू करें / New jobs are paused"}
        </p>
      </div>

      {/* Active Job */}
      {activeJob && (
        <div className="bg-orange-50 rounded-3xl border-2 border-orange-300 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-orange-800 text-lg font-hindi">सक्रिय जॉब / Active Job</h3>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
              {activeJob.status === "in_progress" ? "In Progress" : "Accepted"}
            </span>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-orange-200">
            <p className="font-bold text-brand-navy">{activeJob.subcategory || activeJob.category}</p>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <MapPin size={12} /> {[activeJob.clientAddress, activeJob.clientCity].filter(Boolean).join(", ") || activeJob.location || "—"}
            </p>
            {activeJob.description && (
              <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2">{activeJob.description}</p>
            )}

            {/* Client contact — the worker can call/WhatsApp the client directly */}
            {activeJob.clientMobile && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">Client / ग्राहक</p>
                <p className="font-semibold text-brand-navy text-sm mt-0.5">{activeJob.clientName || "Client"}</p>
                <div className="flex gap-2 mt-2">
                  <a href={`tel:+91${activeJob.clientMobile}`}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-green-700 transition-colors">
                    <Phone size={15} /> Call
                  </a>
                  <a href={`https://wa.me/91${activeJob.clientMobile}`} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366] text-white text-sm font-bold py-2.5 rounded-xl hover:opacity-90 transition-opacity">
                    <MessageCircle size={15} /> WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>
          {activeJob.status === "accepted" ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-600 font-hindi">
                Client से 4-अंकों का code लेकर डालें / Enter the 4-digit code the client gives you
              </p>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={4}
                value={startCodeInput}
                onChange={e => setStartCodeInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="• • • •"
                className="w-full text-center text-2xl font-black tracking-[0.5em] border-2 border-orange-300 rounded-2xl py-3 focus:outline-none focus:border-orange-500"
              />
              <button onClick={handleStartJob} disabled={!!jobActionLoading || startCodeInput.length !== 4}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white font-bold py-3 rounded-2xl hover:bg-orange-600 transition-colors disabled:opacity-50">
                <Play size={18} />
                <span className="font-hindi">{jobActionLoading === "start" ? "Starting..." : "काम शुरू करें / Start Work"}</span>
              </button>
            </div>
          ) : (
            <button onClick={handleCompleteJob} disabled={!!jobActionLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 rounded-2xl hover:bg-blue-700 transition-colors disabled:opacity-50">
              <Trophy size={18} />
              <span className="font-hindi">{jobActionLoading === "complete" ? "Completing..." : "काम पूरा / Mark Complete"}</span>
            </button>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 rounded-2xl p-4 flex flex-col items-center text-center">
          <Briefcase size={20} className="text-brand-navy mb-2" />
          <p className="text-lg font-black text-brand-navy">{worker?.totalJobs ?? "—"}</p>
          <p className="text-xs text-gray-500 font-hindi leading-tight mt-0.5">Total Jobs</p>
        </div>
        <div className="bg-yellow-50 rounded-2xl p-4 flex flex-col items-center text-center">
          <Star size={20} className="text-amber-600 mb-2" />
          <p className="text-lg font-black text-amber-600">{worker?.rating ? worker.rating.toFixed(1) : "New"}</p>
          <p className="text-xs text-gray-500 font-hindi leading-tight mt-0.5">Rating</p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-4 flex flex-col items-center text-center">
          <CreditCard size={20} className="text-purple-700 mb-2" />
          <SubscriptionCountdown expiresAt={worker?.subscriptionExpiry} size="sm" />
          <p className="text-xs text-gray-500 font-hindi leading-tight mt-0.5">Subscription</p>
        </div>
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
        {worker?.status === "approved" && (
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
            { href: "/worker/dashboard/subscription", label: "Subscription", sub: `₹${price}/month`, icon: CreditCard, bg: "bg-green-600" },
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
