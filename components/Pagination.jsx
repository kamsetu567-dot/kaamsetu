"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

// Client-side pagination control. The list pages fetch the full (filtered)
// dataset and search/filter in the browser, then slice it into pages — so
// search still works across ALL records, not just the current page.
//
// Usage:
//   const { pageItems, pageProps } = usePagination(filteredArray, page, setPage, 20);
//   ...render pageItems...
//   <Pagination {...pageProps} />

export function paginate(items, page, perPage) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), pages);
  const start = (safePage - 1) * perPage;
  const pageItems = items.slice(start, start + perPage);
  return {
    pageItems,
    pageProps: {
      page: safePage,
      pages,
      total,
      perPage,
      from: total === 0 ? 0 : start + 1,
      to: Math.min(start + perPage, total),
    },
  };
}

export default function Pagination({ page, pages, total, from, to, onPageChange }) {
  if (total === 0) return null;

  // Compact page-number window: first, last, and a few around the current page.
  const windowSize = 1;
  const nums = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - windowSize && i <= page + windowSize)) {
      nums.push(i);
    } else if (nums[nums.length - 1] !== "…") {
      nums.push("…");
    }
  }

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3 border-t border-gray-50 bg-brand-bg">
      <p className="text-xs text-gray-500">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        {nums.map((n, i) =>
          n === "…" ? (
            <span key={`gap-${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => onPageChange(n)}
              aria-current={n === page ? "page" : undefined}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                n === page
                  ? "bg-brand-navy text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {n}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          aria-label="Next page"
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
