"use client";

// Renders "Hindi / English" bilingual labels consistently across the app
export default function BilingualLabel({ hindi, english, className = "", size = "base" }) {
  const sizes = {
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };
  return (
    <span className={`${sizes[size] || sizes.base} ${className}`}>
      <span className="font-semibold" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
        {hindi}
      </span>
      <span className="text-text-secondary font-normal"> / {english}</span>
    </span>
  );
}
