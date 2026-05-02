"use client";

import { Star } from "lucide-react";

export default function RatingStars({ rating = 0, maxStars = 5, size = 16, showNumber = true }) {
  const filled = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Rating: ${rating} out of ${maxStars}`}>
      {Array.from({ length: maxStars }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < filled ? "text-accent-yellow fill-accent-yellow" : "text-gray-300"}
        />
      ))}
      {showNumber && (
        <span className="text-sm text-text-secondary ml-1">{rating > 0 ? rating.toFixed(1) : "—"}</span>
      )}
    </span>
  );
}
