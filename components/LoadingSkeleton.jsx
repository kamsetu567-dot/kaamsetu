"use client";

function SkeletonBox({ className = "" }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className}`} />;
}

export function WorkerCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
      <div className="flex gap-3">
        <SkeletonBox className="w-16 h-16 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBox className="h-5 w-3/4" />
          <SkeletonBox className="h-4 w-1/2" />
          <SkeletonBox className="h-4 w-2/3" />
        </div>
      </div>
      <SkeletonBox className="h-12 w-full rounded-xl" />
    </div>
  );
}

export function CategoryCardSkeleton() {
  return <SkeletonBox className="h-48 w-full rounded-2xl" />;
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonBox className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
      <SkeletonBox className="h-4 w-1/2" />
      <SkeletonBox className="h-8 w-1/3" />
    </div>
  );
}

export default function LoadingSkeleton({ type = "card", count = 3 }) {
  const components = {
    card: WorkerCardSkeleton,
    category: CategoryCardSkeleton,
    stat: StatCardSkeleton,
  };
  const Comp = components[type] || WorkerCardSkeleton;
  return (
    <div className={type === "category" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
      {Array.from({ length: count }).map((_, i) => (
        <Comp key={i} />
      ))}
    </div>
  );
}
