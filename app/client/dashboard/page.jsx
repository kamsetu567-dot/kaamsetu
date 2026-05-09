"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EmptyState from "@/components/EmptyState";

const STATUS_CONFIG = {
  pending: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    labelHi: "⏳ Worker ढूंढ रहे हैं",
    labelEn: "Finding worker",
  },
  accepted: {
    bg: "bg-green-100",
    text: "text-green-700",
    labelHi: "✅ Accept हुई",
    labelEn: "Accepted",
  },
  completed: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    labelHi: "✓ पूरी हुई",
    labelEn: "Completed",
  },
  saved: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    labelHi: "📞 हम call करेंगे",
    labelEn: "We will call",
  },
  cancelled: {
    bg: "bg-red-100",
    text: "text-red-600",
    labelHi: "✗ Cancel हुई",
    labelEn: "Cancelled",
  },
  rejected: {
    bg: "bg-red-100",
    text: "text-red-600",
    labelHi: "Worker नहीं मिला",
    labelEn: "No worker found",
  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`${cfg.bg} ${cfg.text} text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap`}>
      <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{cfg.labelHi}</span>
      <span className="hidden sm:inline"> / {cfg.labelEn}</span>
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

    if (!token || !userData) {
      router.replace("/auth/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch {
      router.replace("/auth/login");
      return;
    }

    async function fetchRequests() {
      setLoading(true);
      try {
        const t = localStorage.getItem("kaamsetu_token");
        const res = await fetch("/api/client/requests", {
          headers: { Authorization: `Bearer ${t}` },
        });
        const data = await res.json();
        if (data.success) {
          setRequests(data.requests || []);
        } else if (res.status !== 401) {
          console.error("Failed to load requests:", data.message);
        }
      } catch (err) {
        console.error("Request fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRequests();
  }, []); // runs once on mount

  if (!user) return null;

  return (
    <>
      <Header />
      <main className="flex-1 bg-neutral-bg">
        {/* Hero bar */}
        <div className="bg-primary-orange px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <h1
              className="text-2xl font-black text-white mb-0.5"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              नमस्ते, {user.name || "Client"} 👋
            </h1>
            <p className="text-white/80 text-sm">{user.mobile}</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2
                className="text-xl font-black text-text-primary"
                style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
              >
                मेरी Requests / My Requests
              </h2>
              <p className="text-text-secondary text-sm">Your service request history</p>
            </div>
            <Link
              href="/client/request-service"
              className="flex items-center gap-2 bg-primary-orange text-white font-bold px-5 py-3 rounded-xl hover:bg-orange-600 transition-colors"
              aria-label="New service request"
            >
              <PlusCircle size={20} />
              <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>नई Request</span>
              <span> / New Request</span>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border-2 border-border-light p-5 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              icon="jobs"
              titleHi="अभी कोई Request नहीं"
              titleEn="No requests yet"
              descHi="नई request भेजें — हम आपको जल्दी worker मिलाएंगे!"
              descEn="Send a new request — we'll match you with a worker quickly!"
              action={{
                labelHi: "Request भेजें",
                labelEn: "Send Request",
                onClick: () => router.push("/client/request-service"),
              }}
            />
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <div
                  key={req._id}
                  className="bg-white rounded-2xl border-2 border-border-light p-5"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="font-bold text-text-primary">
                        {req.subcategory || req.category}
                      </p>
                      <p className="text-text-secondary text-sm mt-0.5">
                        📍 {req.location?.city || "—"}
                        {req.location?.address && `, ${req.location.address}`}
                      </p>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>

                  {req.description && (
                    <p className="text-sm text-text-secondary mt-2 bg-gray-50 rounded-lg p-2">
                      "{req.description}"
                    </p>
                  )}

                  {req.workerDetails && (
                    <div className="mt-3 pt-3 border-t border-border-light flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-text-secondary mb-0.5">
                          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>Worker:</span>
                        </p>
                        <p className="font-semibold text-sm text-text-primary">{req.workerDetails.name}</p>
                        <p className="text-xs text-text-secondary">
                          ⭐ {req.workerDetails.rating || "New"} · {req.workerDetails.experience} yr exp
                        </p>
                      </div>
                      <a
                        href={`tel:${req.workerDetails.mobile}`}
                        className="bg-primary-green text-white px-4 py-2 rounded-xl text-sm font-bold flex-shrink-0 hover:bg-green-700 transition-colors"
                      >
                        📞 Call
                      </a>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-3">
                    {new Date(req.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
