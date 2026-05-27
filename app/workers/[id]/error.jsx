"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function WorkerProfileError({ error, reset }) {
  useEffect(() => {
    console.error("Worker profile crashed:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-bg flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center mb-4">
        <AlertTriangle size={36} className="text-red-500" />
      </div>
      <h1 className="text-2xl font-black text-brand-navy mb-2">Something went wrong</h1>
      <p className="text-gray-500 text-sm mb-6 max-w-sm">
        We couldn't load this worker's profile. Please try again, or go back to the list.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="bg-brand-navy text-white font-bold px-6 py-3 rounded-xl hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/workers"
          className="border-2 border-gray-200 text-gray-600 font-bold px-6 py-3 rounded-xl hover:border-brand-navy"
        >
          Back to workers
        </Link>
      </div>
    </div>
  );
}
