"use client";

export default function StatCard({ titleHi, titleEn, value, icon: Icon, color = "blue", trend = null }) {
  const colors = {
    blue:   "bg-blue-50 text-blue-700 border-blue-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    green:  "bg-green-50 text-green-700 border-green-100",
    navy:   "bg-brand-navy/10 text-brand-navy border-brand-navy/20",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-100",
    red:    "bg-red-50 text-red-600 border-red-100",
  };
  const iconBg = {
    blue:   "bg-blue-600",
    orange: "bg-orange-500",
    green:  "bg-green-600",
    navy:   "bg-brand-navy",
    yellow: "bg-brand-yellow",
    red:    "bg-red-500",
  };
  return (
    <div className={`rounded-2xl border-2 p-5 ${colors[color] || colors.blue}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-sm opacity-80 font-hindi">{titleHi}</p>
          <p className="text-xs opacity-60">{titleEn}</p>
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl ${iconBg[color] || iconBg.blue} flex items-center justify-center flex-shrink-0`}>
            <Icon size={20} className="text-white" />
          </div>
        )}
      </div>
      <p className="text-3xl font-bold">{value ?? "—"}</p>
      {trend && (
        <p className={`text-xs mt-1 ${trend > 0 ? "text-green-600" : "text-red-500"}`}>
          {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}% से पिछले हफ्ते
        </p>
      )}
    </div>
  );
}
