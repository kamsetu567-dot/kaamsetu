"use client";

import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { getAnalytics } from "@/lib/api/admin";

const PLACEHOLDER_DATA = Array.from({ length: 7 }, (_, i) => ({
  day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
  visits: 0, users: 0, jobs: 0, calls: 0,
}));

function ChartCard({ title, titleHi, children }) {
  return (
    <div className="bg-white rounded-3xl border-2 border-gray-200 p-5">
      <h3
        className="font-black text-brand-navy mb-1"
        style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
      >
        {titleHi}
      </h3>
      <p className="text-gray-500 text-xs mb-4">{title}</p>
      {children}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(PLACEHOLDER_DATA);
  const [range, setRange] = useState("7d");

  useEffect(() => {
    getAnalytics(range).then(chartData => {
      if (Array.isArray(chartData) && chartData.length) {
        setData(chartData.map(d => ({
          day: d.date?.slice(5) ?? "",
          visits: (d.workers ?? 0) + (d.clients ?? 0),
          users: (d.workers ?? 0) + (d.clients ?? 0),
          jobs: d.jobs ?? 0,
          calls: 0,
        })));
      }
    });
  }, [range]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1
            className="text-2xl font-black text-brand-navy"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            विश्लेषण / Analytics
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Platform performance metrics</p>
        </div>
        <div className="flex gap-2">
          {[["7d", "7 Days"], ["30d", "30 Days"], ["90d", "90 Days"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setRange(val)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                range === val
                  ? "bg-brand-navy text-white"
                  : "bg-white border-2 border-gray-200 text-gray-500 hover:border-brand-navy"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Notice when data is empty */}
      {data.every(d => d.visits === 0 && d.jobs === 0) && (
        <div className="flex items-center gap-3 bg-blue-50 border-2 border-blue-200 rounded-2xl px-4 py-3">
          <BarChart3 size={18} className="text-blue-600 flex-shrink-0" />
          <p className="text-blue-600 text-sm">
            <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
              Analytics data backend ready होने के बाद यहाँ दिखेगा।
            </span>
            {" / Charts will populate once the analytics backend is connected."}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ChartCard title="Daily visits to the platform" titleHi="Platform Visits">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="visits" stroke="#2563EB" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="New user registrations" titleHi="नए Users">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="users" fill="#16A34A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Job requests per day" titleHi="Job Requests">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="jobs" fill="#F97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Calls made via platform" titleHi="Calls Made">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="calls" stroke="#1E3A8A" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
