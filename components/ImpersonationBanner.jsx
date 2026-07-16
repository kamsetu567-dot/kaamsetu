"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ShieldAlert, LogOut } from "lucide-react";
import { getImpersonation, endImpersonation } from "@/lib/utils/impersonation";

// Always-visible reminder that this browser is signed in as someone else, plus
// the way back. Mounted at the ROOT layout on purpose: the impersonated account
// has live Logout buttons (Header + both dashboards) and the 1h token expiry
// will eventually trigger a 401 redirect to /auth/login — the banner has to
// survive all of those so the admin is never stranded without an exit.
//
// In-flow `sticky`, NOT `fixed`: the site Header is itself `sticky top-0`, so a
// fixed bar would let the Header re-pin underneath it on scroll and swallow
// ~40px of it. Occupying real layout space avoids that, and the paired
// `body.ks-impersonating header.sticky { top: 2.5rem }` rule in globals.css
// keeps the Header pinned just below us.
export default function ImpersonationBanner() {
  const pathname = usePathname();
  const [imp, setImp] = useState(null);

  // Read on the client only — localStorage doesn't exist during SSR, and
  // rendering from it on the first pass would cause a hydration mismatch.
  useEffect(() => {
    setImp(getImpersonation());
  }, [pathname]);

  const active = imp && !pathname?.startsWith("/admin");

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("ks-impersonating", !!active);
    return () => document.body.classList.remove("ks-impersonating");
  }, [active]);

  if (!active) return null;

  function handleExit() {
    window.location.href = endImpersonation();
  }

  return (
    <div className="sticky top-0 z-[60] h-10 bg-red-600 text-white flex items-center justify-center gap-3 px-3 text-sm">
      <ShieldAlert size={16} className="flex-shrink-0" />
      <p className="truncate">
        {imp.sessionLost ? (
          <>
            <span className="font-bold">Session ended</span>
            <span className="hidden sm:inline"> — this account&apos;s session expired or was logged out.</span>
          </>
        ) : (
          <>
            <span className="hidden sm:inline">Admin view — </span>
            <span className="font-bold">logged in as {imp.name || "user"}</span>
            {imp.type ? <span className="opacity-80"> ({imp.type})</span> : null}
          </>
        )}
      </p>
      <button
        onClick={handleExit}
        className="flex items-center gap-1.5 bg-white text-red-700 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0 min-h-0"
      >
        <LogOut size={13} />
        {imp.sessionLost ? "Return to admin" : "Exit"}
      </button>
    </div>
  );
}
