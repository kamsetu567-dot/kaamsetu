"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlusCircle, LogOut } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const STATUS_CONFIG = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: "⏳ Worker ढूंढ रहे हैं" },
  accepted: { bg: "bg-green-100", text: "text-green-700", label: "✅ Accept हुई" },
  completed: { bg: "bg-blue-100", text: "text-blue-700", label: "✓ पूरी हुई" },
  saved: { bg: "bg-orange-100", text: "text-orange-700", label: "📞 हम call करेंगे" },
  cancelled: { bg: "bg-red-100", text: "text-red-600", label: "✗ Cancel हुई" },
  rejected: { bg: "bg-red-100", text: "text-red-600", label: "Worker नहीं मिला" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`${cfg.bg} ${cfg.text} text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap font-hindi`}>
      {cfg.label}
    </span>
  );
}

export default function ClientDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("kaamsetu_token");
    const userData = localStorage.getItem("kaamsetu_user");
    if (!token || !userData) { router.replace("/auth/login"); return; }
    try {
      setUser(JSON.parse(userData));
    } catch { router.replace("/auth/login"); return; }

    async function fetchRequests() {
      setLoading(true);
      try {
        const t = localStorage.getItem("kaamsetu_token");
        const res = await fetch("/api/client/requests", { headers: { Authorization: `Bearer ${t}` } });
        const data = await res.json();
        if (data.success) setRequests(data.requests || []);
        else if (res.status !== 401) console.error("Failed to load requests:", data.message);
      } catch (err) { console.error("Request fetch error:", err); }
      finally { setLoading(false); }
    }
    fetchRequests();
  }, []);

  function handleLogout() {
    localStorage.removeItem("kaamsetu_token");
    localStorage.removeItem("kaamsetu_user");
    router.push("/");
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-brand-bg">
        {/* Hero bar */}
        <div className="bg-brand-navy px-4 py-8">
          <div className="max-w-4xl mx-auto flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-black text-white mb-0.5 font-hindi">
                नमस्ते, {user.name || "Client"} 👋
              </h1>
              <p className="text-white/60 text-sm">+91 {user.mobile}</p>
            </div>
            <button onClick={handleLogout} className="text-white/50 hover:text-white flex items-center gap-1 text-sm min-h-0">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-xl font-black text-brand-navy font-hindi">मेरी Requests</h2>
              <p className="text-gray-400 text-sm">Your service request history</p>
            </div>
            <Link href="/client/request-service"
              className="flex items-center gap-2 bg-brand-yellow text-brand-navy font-bold px-5 py-3 rounded-xl hover:bg-amber-400 transition-colors font-hindi">
              <PlusCircle size={20} />
              नई Request / New Request
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <PlusCircle size={28} className="text-brand-navy" />
              </div>
              <h3 className="font-black text-brand-navy text-lg font-hindi mb-1">अभी कोई Request नहीं</h3>
              <p className="text-gray-400 text-sm font-hindi mb-5">नई request भेजें — हम आपको जल्दी worker मिलाएंगे!</p>
              <Link href="/client/request-service"
                className="inline-block bg-brand-navy text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-navy-dark transition-colors font-hindi">
                Request भेजें
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req._id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="font-bold text-brand-navy">{req.subcategory || req.category}</p>
                      <p className="text-gray-400 text-sm mt-0.5">
                        📍 {req.location?.city || "—"}{req.location?.address && `, ${req.location.address}`}
                      </p>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>

                  {req.description && (
                    <p className="text-sm text-gray-500 mt-2 bg-gray-50 rounded-lg p-2 font-hindi">
                      "{req.description}"
                    </p>
                  )}

                  {req.workerDetails && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm text-brand-navy">{req.workerDetails.name}</p>
                        <p className="text-xs text-gray-400">
                          ⭐ {req.workerDetails.rating || "New"} · {req.workerDetails.experience} yr exp
                        </p>
                      </div>
                      <a href={`tel:${req.workerDetails.mobile}`}
                        className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex-shrink-0 hover:bg-green-600 transition-colors">
                        📞 Call
                      </a>
                    </div>
                  )}

                  <p className="text-xs text-gray-300 mt-3">
                    {new Date(req.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
