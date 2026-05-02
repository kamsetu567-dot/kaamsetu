import Link from "next/link";
import { ArrowLeft, Hammer, Briefcase, Store, Wrench } from "lucide-react";

export const metadata = {
  title: "साइनअप करें / Sign Up — KaamSetu",
};

const ROLES = [
  {
    href: "/auth/signup/client",
    icon: Hammer,
    color: "bg-primary-orange",
    hover: "hover:bg-orange-600",
    hi: "काम करवाना है",
    en: "I need a worker",
    desc: "Client — Hire plumber, cook, decorator, etc.",
  },
  {
    href: "/auth/signup/worker",
    icon: Briefcase,
    color: "bg-primary-blue",
    hover: "hover:bg-blue-700",
    hi: "काम ढूंढना है",
    en: "I want to find work",
    desc: "Worker — Register as plumber, dancer, tutor, etc.",
  },
  {
    href: "/auth/signup/shop",
    icon: Store,
    color: "bg-primary-navy",
    hover: "hover:bg-blue-900",
    hi: "दुकान / विज्ञापन",
    en: "Shop / Advertise",
    desc: "Shop owner — List your shop, place ads.",
  },
];

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-neutral-bg flex flex-col">
      <div className="bg-primary-navy px-4 py-4 flex items-center gap-3">
        <Link href="/" className="text-white/70 hover:text-white" aria-label="Back to home">
          <ArrowLeft size={24} />
        </Link>
        <div className="flex items-center gap-2">
          <Wrench size={20} className="text-accent-yellow" />
          <span className="font-black text-white text-lg">KAAM<span className="text-accent-yellow">SETU</span></span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1
              className="text-2xl font-black text-text-primary mb-1"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              आप कौन हैं?
            </h1>
            <p className="text-text-secondary text-sm">Who are you? Select your role</p>
          </div>

          <div className="space-y-4">
            {ROLES.map(role => (
              <Link
                key={role.href}
                href={role.href}
                className={`${role.color} ${role.hover} text-white rounded-2xl p-6 flex items-center gap-5 transition-all hover:scale-105 hover:shadow-lg block`}
                aria-label={role.en}
              >
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <role.icon size={28} />
                </div>
                <div>
                  <p
                    className="font-black text-xl"
                    style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                  >
                    {role.hi}
                  </p>
                  <p className="font-semibold opacity-90">{role.en}</p>
                  <p className="text-sm opacity-70 mt-0.5">{role.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          <p className="text-center text-sm text-text-secondary mt-8">
            <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>पहले से Account है?</span>
            {" "}
            <Link href="/auth/login" className="text-primary-blue font-semibold hover:underline">
              <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>लॉगिन करें</span>
              <span> / Login</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
