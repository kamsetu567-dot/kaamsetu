"use client";

export default function StatCard({ titleHi, titleEn, value, icon: Icon, color = "blue", trend = null }) {
  const colors = {
    blue: "bg-blue-50 text-primary-blue border-blue-100",
    orange: "bg-orange-50 text-primary-orange border-orange-100",
    green: "bg-green-50 text-primary-green border-green-100",
    navy: "bg-navy-50 text-primary-navy border-navy-100",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-100",
    red: "bg-red-50 text-red-600 border-red-100",
  };
  const iconBg = {
    blue: "bg-primary-blue",
    orange: "bg-primary-orange",
    green: "bg-primary-green",
    navy: "bg-primary-navy",
    yellow: "bg-accent-yellow",
    red: "bg-red-500",
  };
  return (
    <div className={`rounded-2xl border-2 p-5 ${colors[color] || colors.blue}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p
            className="font-semibold text-sm opacity-80"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            {titleHi}
          </p>
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
