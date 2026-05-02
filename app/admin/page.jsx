"use client";

import { useState, useEffect } from "react";
import {
  Users, UserCheck, Briefcase, Phone, TrendingUp,
  IndianRupee, Activity, Wifi, WifiOff,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import { StatCardSkeleton } from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import { getDashboardStats } from "@/lib/api/admin";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then(data => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  const statCards = stats
    ? [
        { titleHi: "कुल Workers",      titleEn: "Total Workers",      value: stats.totalWorkers,   icon: UserCheck,    color: "blue"   },
        { titleHi: "Active Workers",   titleEn: "Verified & Live",    value: stats.activeWorkers,  icon: Activity,     color: "green"  },
        { titleHi: "कुल Clients",      titleEn: "Total Clients",      value: stats.totalClients,   icon: Users,        color: "orange" },
        { titleHi: "आज की Jobs",       titleEn: "Today's Jobs",       value: stats.todayJobs,      icon: Briefcase,    color: "navy"   },
        { titleHi: "कुल Calls",        titleEn: "Total Calls Made",   value: stats.totalCalls,     icon: Phone,        color: "blue"   },
        { titleHi: "कुल कमाई",         titleEn: "Total Earnings",     value: `₹${stats.totalEarnings}`, icon: IndianRupee, color: "green" },
        { titleHi: "काम पर Workers",   titleEn: "Working Now",        value: stats.workingWorkers, icon: Wifi,         color: "orange" },
        { titleHi: "खाली Workers",     titleEn: "Free / Available",   value: stats.freeWorkers,    icon: WifiOff,      color: "yellow" },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1
          className="text-2xl font-black text-text-primary"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          डैशबोर्ड / Dashboard
        </h1>
        <p className="text-text-secondary text-sm mt-0.5">Platform overview at a glance</p>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(s => (
            <StatCard key={s.titleEn} {...s} />
          ))}
        </div>
      )}

      {/* Live activity feed */}
      <div className="bg-white rounded-3xl border-2 border-border-light p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-primary-green animate-pulse" />
          <h2
            className="font-black text-text-primary"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            Live Activity / लाइव गतिविधि
          </h2>
        </div>
        <EmptyState
          icon="default"
          titleHi="कोई गतिविधि नहीं"
          titleEn="No recent activity"
          descHi="जब workers/clients platform पर active होंगे, यहाँ दिखेगा।"
          descEn="Activity from workers and clients will appear here in real-time."
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: "/admin/workers",      hi: "Workers देखें",    en: "View Workers",   bg: "bg-primary-blue   text-white" },
          { href: "/admin/jobs",         hi: "Jobs देखें",       en: "View Jobs",      bg: "bg-primary-green  text-white" },
          { href: "/admin/payments",     hi: "भुगतान सेटिंग",   en: "Payment Setup",  bg: "bg-primary-orange text-white" },
          { href: "/admin/analytics",    hi: "Analytics",        en: "View Charts",    bg: "bg-primary-navy   text-white" },
        ].map(a => (
          <a
            key={a.href}
            href={a.href}
            className={`rounded-2xl p-4 font-bold text-center ${a.bg} hover:opacity-90 transition-opacity`}
          >
            <p
              className="text-sm"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              {a.hi}
            </p>
            <p className="text-xs opacity-80 mt-0.5">{a.en}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
