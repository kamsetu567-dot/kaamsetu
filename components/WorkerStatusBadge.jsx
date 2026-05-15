"use client";

export default function WorkerStatusBadge({ status = "free", size = "sm" }) {
  const isFree = status === "free";
  const sizes = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-3 py-1 gap-1.5",
    lg: "text-base px-4 py-2 gap-2",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border ${sizes[size] || sizes.sm} ${
        isFree
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-orange-50 text-orange-600 border-orange-200"
      }`}
      aria-label={isFree ? "Worker is available" : "Worker is busy"}
    >
      <span
        className={`rounded-full flex-shrink-0 ${
          size === "sm" ? "w-2 h-2" : size === "lg" ? "w-3 h-3" : "w-2.5 h-2.5"
        } ${isFree ? "bg-green-600" : "bg-orange-500"}`}
      />
      <span className="font-hindi">{isFree ? "खाली" : "व्यस्त"}</span>
      <span className="font-normal">/ {isFree ? "Free" : "Working"}</span>
    </span>
  );
}
