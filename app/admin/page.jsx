"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, UserCheck, Briefcase, Phone, TrendingUp,
  IndianRupee, Activity, Wifi, WifiOff, RefreshCw,
} from "lucide-react";
import { getDashboardStats } from "@/lib/api/admin";

function StatCard({ titleHi, titleEn, value, icon: Icon, color }) {
  const colorMap = {
    blue:   "bg-blue-50 text-blue-700",
    green:  "bg-green-50 text-green-700",
    orange: "bg-orange-50 text-orange-600",
    navy:   "bg-brand-navy/10 text-brand-navy",
    yellow: "bg-yellow-50 text-yellow-700",
  };
  const cls = colorMap[color] || colorMap.blue;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-xl ${cls} flex items-center justify-center mb-3`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-black text-brand-navy">{value ?? "—"}</p>
      <p className="text-xs font-bold text-gray-500 mt-0.5 font-hindi">{titleHi}</p>
      <p className="text-xs text-gray-300">{titleEn}</p>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-gray-200 mb-3" />
      <div className="h-7 bg-gray-200 rounded w-16 mb-1" />
      <div className="h-3 bg-gray-100 rounded w-24" />
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    getDashboardStats().then(data => { setStats(data); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  const statCards = stats ? [
    { titleHi: "कुल Workers",    titleEn: "Total Workers",      value: stats.totalWorkers,   icon: UserCheck,    color: "blue"   },
    { titleHi: "Active Workers", titleEn: "Verified & Live",    value: stats.activeWorkers,  icon: Activity,     color: "green"  },
    { titleHi: "Pending Workers",titleEn: "Awaiting Approval",  value: stats.pendingWorkers, icon: UserCheck,    color: "orange" },
    { titleHi: "कुल Clients",    titleEn: "Total Clients",      value: stats.totalClients,   icon: Users,        color: "navy"   },
    { titleHi: "आज की Jobs",     titleEn: "Today's Jobs",       value: stats.todayJobs,      icon: Briefcase,    color: "blue"   },
    { titleHi: "कुल कमाई",       titleEn: "Total Earnings",     value: `₹${stats.totalEarnings}`, icon: IndianRupee, color: "green" },
    { titleHi: "काम पर Workers", titleEn: "Working Now",        value: stats.workingWorkers, icon: Wifi,         color: "orange" },
    { titleHi: "खाली Workers",   titleEn: "Free / Available",   value: stats.freeWorkers,    icon: WifiOff,      color: "yellow" },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-brand-navy font-hindi">डैशबोर्ड / Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Platform overview at a glance</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1 text-brand-navy text-sm font-semibold hover:opacity-70 disabled:opacity-40 min-h-0">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map(s => <StatCard key={s.titleEn} {...s} />)
        }
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: "/admin/workers",          label: "Workers देखें",   sub: "Approve / manage",   bg: "bg-brand-navy" },
          { href: "/admin/pending-requests",  label: "Requests",        sub: "Pending service requests", bg: "bg-green-600" },
          { href: "/admin/jobs",             label: "Jobs देखें",      sub: "All job requests",   bg: "bg-amber-500" },
          { href: "/admin/clients",          label: "Clients",          sub: "Manage clients",     bg: "bg-purple-600" },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className={`rounded-2xl p-4 font-bold text-white ${a.bg} hover:opacity-90 transition-opacity`}>
            <p className="text-sm font-hindi">{a.label}</p>
            <p className="text-xs opacity-70 mt-0.5">{a.sub}</p>
          </Link>
        ))}
      </div>

      {/* Live activity placeholder */}
      <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <h2 className="font-black text-brand-navy font-hindi">Live Activity / लाइव गतिविधि</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-300 text-sm">Live activity feed coming soon</p>
        </div>
      </div>
    </div>
  );
}
