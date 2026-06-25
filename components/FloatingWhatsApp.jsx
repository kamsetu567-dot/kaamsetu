"use client";

import { usePathname } from "next/navigation";

const SUPPORT_NUMBER = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "918410270299";
const COMMUNITY_URL = process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL || "";

function WhatsAppIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 32 32" width="26" height="26" fill="white" className={className}>
      <path d="M16 2C8.268 2 2 8.268 2 16c0 2.478.675 4.8 1.85 6.793L2 30l7.415-1.82A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.6a11.56 11.56 0 01-5.892-1.614l-.42-.25-4.397 1.08 1.124-4.27-.273-.44A11.52 11.52 0 014.4 16C4.4 9.597 9.597 4.4 16 4.4S27.6 9.597 27.6 16 22.403 27.6 16 27.6zm6.345-8.684c-.348-.174-2.058-1.015-2.378-1.13-.32-.117-.553-.175-.786.174-.232.348-.9 1.13-1.103 1.363-.203.232-.406.26-.754.087-.348-.175-1.47-.542-2.8-1.727-1.035-.924-1.733-2.063-1.936-2.411-.203-.348-.022-.537.153-.71.157-.156.348-.406.522-.61.174-.203.232-.348.348-.58.116-.232.058-.435-.029-.61-.087-.174-.786-1.893-1.077-2.594-.283-.68-.572-.587-.786-.598l-.67-.012c-.232 0-.61.087-.928.435-.319.348-1.218 1.19-1.218 2.9s1.247 3.364 1.421 3.597c.174.232 2.454 3.746 5.95 5.251.832.36 1.481.574 1.988.734.835.266 1.596.229 2.197.139.67-.1 2.058-.841 2.348-1.655.29-.813.29-1.51.203-1.655-.087-.145-.319-.232-.667-.406z"/>
    </svg>
  );
}

export default function FloatingWhatsApp() {
  const pathname = usePathname();
  // Admin panel doesn't need a customer-support bubble
  if (pathname?.startsWith("/admin")) return null;
  if (!SUPPORT_NUMBER && !COMMUNITY_URL) return null;
  return (
    <div className="fixed bottom-6 right-4 z-50 flex flex-col items-end gap-3">
      {COMMUNITY_URL && (
        <a
          href={COMMUNITY_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Join the KaamSetu WhatsApp community"
          className="group relative w-14 h-14 bg-brand-navy rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        >
          <WhatsAppIcon />
          <span className="absolute -left-2 -translate-x-full top-1/2 -translate-y-1/2 bg-brand-navy text-white text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
            Community
          </span>
        </a>
      )}
      {SUPPORT_NUMBER && (
        <a
          href={`https://wa.me/${SUPPORT_NUMBER}?text=Hi%2C%20I%20need%20help%20with%20KaamSetu`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with KaamSetu support on WhatsApp"
          className="group relative w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        >
          <WhatsAppIcon />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75" />
          <span className="absolute -left-2 -translate-x-full top-1/2 -translate-y-1/2 bg-[#128C7E] text-white text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
            Support
          </span>
        </a>
      )}
    </div>
  );
}
