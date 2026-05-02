"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";

// TODO: Persist via API when backend is ready
const STATUS_CONFIG = {
  pending: { label: "Pending", hi: "लंबित", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  accepted: { label: "Accepted", hi: "Accept हुई", color: "bg-green-100 text-primary-green", icon: CheckCircle },
  rejected: { label: "Not Found", hi: "Worker नहीं मिला", color: "bg-red-100 text-red-600", icon: XCircle },
};

export default function ClientDashboardPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch client job history from API
    setTimeout(() => { setRequests([]); setLoading(false); }, 600);
  }, []);

  return (
    <>
      <Header />
      <main className="flex-1 bg-neutral-bg">
        <div className="bg-primary-orange px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <h1
              className="text-2xl font-black text-white mb-1"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              Client Dashboard
            </h1>
            <p className="text-white/80">Manage your service requests</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
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
              <span>/ New Request</span>
            </Link>
          </div>

          {loading ? (
            <LoadingSkeleton type="card" count={3} />
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
                onClick: () => (window.location.href = "/client/request-service"),
              }}
            />
          ) : (
            <div className="space-y-4">
              {requests.map(req => {
                const sc = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                return (
                  <div key={req.id} className="bg-white rounded-2xl border-2 border-border-light p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-text-primary">{req.category}</p>
                        <p className="text-text-secondary text-sm">{req.subcategory}</p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${sc.color}`}>
                        <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{sc.hi}</span>
                      </span>
                    </div>
                    <p className="text-text-secondary text-sm mt-2">{req.location} · {req.date}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
