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
      <span className="font-semibold font-hindi">{hindi}</span>
      <span className="text-gray-500 font-normal"> / {english}</span>
    </span>
  );
}
