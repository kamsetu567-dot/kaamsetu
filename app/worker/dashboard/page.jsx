"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User, Star, Clock, MapPin, Play, Square,
  ShieldCheck, CreditCard, Briefcase,
} from "lucide-react";
import WorkerStatusBadge from "@/components/WorkerStatusBadge";
import RatingStars from "@/components/RatingStars";
import { useWorkerStatus } from "@/lib/context/WorkerStatusContext";

// Format relative time from a Date
function formatTime(date) {
  if (!date) return "—";
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "अभी / Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} मिनट पहले / mins ago`;
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// Work Status card — uses WorkerStatusContext (in-memory, no persistence)
function WorkStatusCard() {
  const { status, lastUpdated, startWork, endWork } = useWorkerStatus();
  const isFree = status === "free";

  return (
    <div className={`rounded-3xl border-2 p-6 ${isFree ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}>
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            className="font-black text-text-primary text-lg"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            काम की स्थिति
          </h2>
          <p className="text-text-secondary text-sm">Work Status</p>
        </div>
        <WorkerStatusBadge status={status} size="lg" />
      </div>

      {/* Current status display */}
      <div className={`rounded-2xl p-4 mb-5 text-center ${isFree ? "bg-green-100" : "bg-orange-100"}`}>
        <p className="text-4xl mb-1">{isFree ? "🟢" : "🔴"}</p>
        <p
          className={`text-xl font-black ${isFree ? "text-green-700" : "text-working-orange"}`}
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          {isFree ? "खाली हूँ / Free" : "काम पर हूँ / Working"}
        </p>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={startWork}
          disabled={!isFree}
          className="flex items-center justify-center gap-2 bg-primary-green text-white font-bold py-4 rounded-2xl hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-14"
          aria-label="Start work"
        >
          <Play size={18} fill="currentColor" />
          <div className="text-left">
            <span
              className="block text-sm"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              काम पर जाएं
            </span>
            <span className="text-xs font-normal block opacity-80">Start Work</span>
          </div>
        </button>
        <button
          onClick={endWork}
          disabled={isFree}
          className="flex items-center justify-center gap-2 bg-red-500 text-white font-bold py-4 rounded-2xl hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-14"
          aria-label="End work"
        >
          <Square size={18} fill="currentColor" />
          <div className="text-left">
            <span
              className="block text-sm"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              काम खत्म
            </span>
            <span className="text-xs font-normal block opacity-80">End Work</span>
          </div>
        </button>
      </div>

      {/* Timestamp */}
      <p className="text-xs text-text-secondary text-center">
        <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>पिछली बार बदला गया</span>
        {" / Last updated: "}
        <span className="font-semibold text-text-primary">{formatTime(lastUpdated)}</span>
      </p>
      {/* TODO: Sync status to backend via API when ready */}
    </div>
  );
}

// Profile summary card (static placeholder — data from API when backend ready)
function ProfileCard() {
  // TODO: Persist via API when backend is ready
  return (
    <div className="bg-white rounded-3xl border-2 border-border-light p-6">
      <div className="flex items-start justify-between mb-4">
        <h2
          className="font-black text-text-primary text-lg"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          प्रोफ़ाइल / Profile
        </h2>
        <Link
          href="/worker/dashboard/profile"
          className="text-primary-blue text-sm font-semibold hover:underline"
          aria-label="Edit profile"
        >
          Edit / संपादित करें
        </Link>
      </div>
      <div className="flex gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 border-2 border-border-light">
          <User size={32} className="text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-text-primary text-base">—</p>
          <p className="text-text-secondary text-sm">No profile yet</p>
          <div className="mt-1"><RatingStars rating={0} size={14} /></div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-border-light">
        <MiniStat icon={Clock} hi="अनुभव" en="Experience" value="— साल" />
        <MiniStat icon={MapPin} hi="लोकेशन" en="Location" value="—" />
        <MiniStat icon={Star} hi="रेटिंग" en="Rating" value="—" />
        <MiniStat icon={ShieldCheck} hi="Status" en="Approval" value="Pending" />
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, hi, en, value }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-primary-blue" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-text-secondary truncate">
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{hi}</span>
          {" / "}{en}
        </p>
        <p className="text-sm font-bold text-text-primary truncate">{value}</p>
      </div>
    </div>
  );
}

// Quick stats row
function QuickStats() {
  const stats = [
    { hi: "आज की Jobs", en: "Today's Jobs", value: "0", color: "bg-blue-50 text-primary-blue", icon: Briefcase },
    { hi: "कुल Jobs", en: "Total Jobs", value: "0", color: "bg-orange-50 text-primary-orange", icon: Star },
    { hi: "Subscription", en: "Plan Status", value: "Pending", color: "bg-yellow-50 text-yellow-700", icon: CreditCard },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(s => (
        <div key={s.hi} className={`${s.color} rounded-2xl p-4 flex flex-col items-center text-center`}>
          <s.icon size={20} className="mb-2" />
          <p className="text-xl font-black">{s.value}</p>
          <p
            className="text-xs font-semibold mt-0.5 leading-tight"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            {s.hi}
          </p>
          <p className="text-xs opacity-70">{s.en}</p>
        </div>
      ))}
    </div>
  );
}

export default function WorkerDashboardOverview() {
  return (
    <div className="space-y-5">

      {/* 1 — Work Status card (top, most prominent) */}
      <WorkStatusCard />

      {/* 2 — Quick stats */}
      <QuickStats />

      {/* 3 — Profile summary */}
      <ProfileCard />

      {/* 4 — Quick links to other tabs */}
      <div className="bg-white rounded-3xl border-2 border-border-light p-5">
        <h3
          className="font-black text-text-primary mb-4"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          Quick Links / शॉर्टकट
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: "/worker/dashboard/jobs", hi: "Incoming Jobs", en: "जॉब notifications", icon: Briefcase, color: "bg-primary-blue" },
            { href: "/worker/dashboard/subscription", hi: "Subscription", en: "₹199/month plan", icon: CreditCard, color: "bg-primary-green" },
            { href: "/worker/dashboard/profile", hi: "Edit Profile", en: "प्रोफ़ाइल बदलें", icon: User, color: "bg-primary-orange" },
            { href: "/worker/dashboard/referrals", hi: "Referrals", en: "₹20–₹50 earn करें", icon: Star, color: "bg-primary-navy" },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`${link.color} text-white rounded-2xl p-4 flex flex-col gap-2 hover:opacity-90 transition-opacity`}
              aria-label={link.hi}
            >
              <link.icon size={22} />
              <div>
                <p className="font-bold text-sm">{link.hi}</p>
                <p
                  className="text-xs opacity-80"
                  style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                >
                  {link.en}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
