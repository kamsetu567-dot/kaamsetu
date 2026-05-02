import Link from "next/link";

export default function ActionCard({ hindi, english, icon: Icon, color, href }) {
  const colorMap = {
    orange: { bg: "bg-primary-orange", hover: "hover:bg-orange-600", text: "text-white" },
    blue: { bg: "bg-primary-blue", hover: "hover:bg-blue-700", text: "text-white" },
    green: { bg: "bg-primary-green", hover: "hover:bg-green-700", text: "text-white" },
    navy: { bg: "bg-primary-navy", hover: "hover:bg-blue-900", text: "text-white" },
  };
  const style = colorMap[color] || colorMap.orange;
  return (
    <Link
      href={href}
      className={`${style.bg} ${style.hover} ${style.text} rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all duration-200 hover:scale-105 hover:shadow-xl min-h-36 gap-3 group`}
      aria-label={english}
    >
      {Icon && (
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
          <Icon size={28} className="text-white" />
        </div>
      )}
      <div>
        <p
          className="font-black text-xl leading-tight"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          {hindi}
        </p>
        <p className="text-sm font-normal opacity-80 mt-0.5">{english}</p>
      </div>
    </Link>
  );
}
