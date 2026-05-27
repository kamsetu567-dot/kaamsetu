"use client";

import { useState, useEffect } from "react";
import { Clock, AlertCircle } from "lucide-react";

// Live ticking countdown to an ISO date string / Date.
// >24h left   → green   "Nd Hh left"           (re-renders every minute)
// <24h left   → orange  "HH:MM:SS"             (re-renders every second)
// expired/null → red    "Subscription expired"
export default function SubscriptionCountdown({ expiresAt, size = "md", className = "" }) {
  const [now, setNow] = useState(() => Date.now());

  const target = expiresAt ? new Date(expiresAt).getTime() : null;
  const msLeft = target ? target - now : 0;
  const underDay = target && msLeft > 0 && msLeft < 24 * 60 * 60 * 1000;

  useEffect(() => {
    if (!target) return;
    const interval = underDay ? 1000 : 60_000;
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [target, underDay]);

  const sizeCls = size === "lg"
    ? "text-3xl font-black"
    : size === "sm"
    ? "text-sm font-bold"
    : "text-lg font-black";

  if (!target || msLeft <= 0) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-red-600 ${sizeCls} ${className}`}>
        <AlertCircle size={size === "lg" ? 22 : 14} />
        <span>Subscription expired</span>
      </span>
    );
  }

  const totalSeconds = Math.floor(msLeft / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (underDay) {
    const pad = n => String(n).padStart(2, "0");
    return (
      <span className={`inline-flex items-center gap-1.5 text-orange-600 ${sizeCls} ${className}`}>
        <Clock size={size === "lg" ? 22 : 14} />
        <span className="tabular-nums">{pad(hours)}:{pad(minutes)}:{pad(seconds)}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-green-600 ${sizeCls} ${className}`}>
      <Clock size={size === "lg" ? 22 : 14} />
      <span className="tabular-nums">{days}d {hours}h left</span>
    </span>
  );
}
