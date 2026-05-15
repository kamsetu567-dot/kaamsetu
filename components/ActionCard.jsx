import Link from "next/link";

export default function ActionCard({ hindi, english, icon: Icon, color, href }) {
  const colorMap = {
    orange: { bg: "bg-brand-yellow",  hover: "hover:opacity-90", text: "text-brand-navy" },
    blue:   { bg: "bg-blue-600",      hover: "hover:bg-blue-700", text: "text-white" },
    green:  { bg: "bg-green-600",     hover: "hover:bg-green-700", text: "text-white" },
    navy:   { bg: "bg-brand-navy",    hover: "hover:opacity-90", text: "text-white" },
  };
  const style = colorMap[color] || colorMap.navy;
  return (
    <Link
      href={href}
      className={`${style.bg} ${style.hover} ${style.text} rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all duration-200 hover:scale-105 hover:shadow-xl min-h-36 gap-3 group`}
      aria-label={english}
    >
      {Icon && (
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
          <Icon size={28} className={style.text} />
        </div>
      )}
      <div>
        <p className="font-black text-xl leading-tight font-hindi">{hindi}</p>
        <p className="text-sm font-normal opacity-80 mt-0.5">{english}</p>
      </div>
    </Link>
  );
}
