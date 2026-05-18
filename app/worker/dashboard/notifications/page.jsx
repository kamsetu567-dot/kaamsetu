"use client";

import { Bell, Info } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useRoleGuard } from "@/lib/auth/useRoleGuard";

export default function WorkerNotificationsPage() {
  useRoleGuard("worker");
  // TODO: Persist via API when backend is ready — fetch from notification service
  const notifications = [];

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

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border-2 border-blue-200 rounded-2xl px-4 py-3">
        <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <p
          className="text-blue-600 text-sm"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          Job notifications, subscription alerts, और admin messages यहाँ आएंगे।
          <span className="font-normal text-blue-700"> / Job alerts, subscription notices, and admin messages appear here.</span>
        </p>
      </div>

      {notifications.length === 0 ? (
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
