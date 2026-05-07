"use client";

import { SearchX, Users, Briefcase, PackageSearch } from "lucide-react";

const ICONS = {
  search: SearchX,
  workers: Users,
  jobs: Briefcase,
  default: PackageSearch,
};

export default function EmptyState({
  icon = "default",
  titleHi = "कुछ नहीं मिला",
  titleEn = "Nothing found",
  descHi = "",
  descEn = "",
  action = null, // { labelHi, labelEn, onClick }
}) {
  const Icon = ICONS[icon] || ICONS.default;
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center w-full">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        <Icon size={40} className="text-gray-400" />
      </div>
      <h3
        className="text-xl font-bold text-text-primary mb-2"
        style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
      >
        {titleHi}
      </h3>
      <p className="text-sm text-text-secondary mb-1">{titleEn}</p>
      {descHi && (
        <p
          className="text-sm text-text-secondary mt-2 max-w-sm"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          {descHi}
        </p>
      )}
      {descEn && <p className="text-xs text-gray-400 mt-1 max-w-sm">{descEn}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 bg-primary-orange text-white font-bold px-8 py-4 rounded-xl hover:bg-orange-600 transition-colors w-full max-w-xs"
          aria-label={action.labelEn}
        >
          <span className="block text-base" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{action.labelHi}</span>
          <span className="block text-sm font-normal mt-0.5">{action.labelEn}</span>
        </button>
      )}
    </div>
  );
}
