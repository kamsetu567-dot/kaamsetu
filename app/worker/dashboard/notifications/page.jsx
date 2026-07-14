"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Info, Briefcase } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { apiGet, apiPost } from "@/lib/api/client";
import { useRoleGuard } from "@/lib/auth/useRoleGuard";

export default function WorkerNotificationsPage() {
  useRoleGuard("worker");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGet("/api/notifications")
      .then(data => {
        if (cancelled) return;
        setNotifications(
          (data.notifications || []).map(n => ({
            ...n,
            time: n.createdAt ? new Date(n.createdAt).toLocaleString("en-IN") : "",
          }))
        );
        // Viewing this tab counts as reading them — clears the bell badge too.
        apiPost("/api/notifications/read").catch(() => {});
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h2
          className="text-xl font-black text-brand-navy"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          सूचनाएँ
        </h2>
        <p className="text-gray-500 text-sm mt-0.5">Notifications / Alerts</p>
      </div>

      {/* Incoming jobs shortcut */}
      <Link href="/worker/dashboard/jobs"
        className="flex items-center gap-4 bg-brand-navy text-white rounded-2xl px-5 py-4 hover:opacity-90 transition-opacity">
        <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Briefcase size={22} />
        </div>
        <div className="flex-1">
          <p className="font-black font-hindi">Incoming Jobs देखें</p>
          <p className="text-white/70 text-sm">नए job notifications — जॉब्स tab में हैं</p>
        </div>
        <span className="text-white/60 text-xl">→</span>
      </Link>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border-2 border-blue-200 rounded-2xl px-4 py-3">
        <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <p
          className="text-blue-600 text-sm"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          Subscription alerts और admin messages यहाँ आएंगे।
          <span className="font-normal text-blue-700"> / Subscription notices and admin messages will appear here.</span>
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton type="card" count={2} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="default"
          titleHi="कोई सूचना नहीं"
          titleEn="No notifications yet"
          descHi="जब कोई job या update आएगा, यहाँ दिखेगा।"
          descEn="Job alerts and updates will appear here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`bg-white rounded-2xl border-2 p-4 flex items-start gap-3 ${
                n.unread ? "border-blue-600" : "border-gray-200"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                n.unread ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                <Bell size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-brand-navy text-sm">{n.title}</p>
                <p className="text-gray-500 text-sm mt-0.5">{n.body}</p>
                <p className="text-xs text-gray-500 mt-1">{n.time}</p>
              </div>
              {n.unread && (
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
