import Link from "next/link";
import { Wrench } from "lucide-react";

const footerLinks = [
  { href: "/about", hi: "हमारे बारे में", en: "About" },
  { href: "/privacy", hi: "प्राइवेसी", en: "Privacy" },
  { href: "/terms", hi: "नियम", en: "Terms" },
  { href: "/disclaimer", hi: "डिस्क्लेमर", en: "Disclaimer" },
];

export default function Footer() {
  return (
    <footer className="bg-primary-navy text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
          {/* Brand */}
          <div className="text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
              <div className="w-8 h-8 bg-accent-yellow rounded-lg flex items-center justify-center">
                <Wrench size={16} className="text-primary-navy" />
              </div>
              <span className="font-black text-xl">
                <span>KAAM</span>
                <span className="text-accent-yellow">SETU</span>
              </span>
            </div>
            <p
              className="text-white/70 text-sm"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              हर काम, हर जगह
            </p>
            <p className="text-white/50 text-xs mt-1">Every job, everywhere</p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {footerLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/70 hover:text-accent-yellow transition-colors text-sm"
              >
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{link.hi}</span>
                <span className="text-white/40"> / {link.en}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p
            className="text-white/50 text-xs leading-relaxed max-w-2xl mx-auto"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            KaamSetu एक connecting platform है। सभी सेवाएँ Workers द्वारा दी जाती हैं।
            KaamSetu किसी भी सेवा की गुणवत्ता की गारंटी नहीं देता।
          </p>
          <p className="text-white/30 text-xs mt-2">
            KaamSetu is a connecting platform. All services are delivered by Workers. Quality not guaranteed.
          </p>
          <p className="text-white/30 text-xs mt-4">
            © {new Date().getFullYear()} KaamSetu. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
