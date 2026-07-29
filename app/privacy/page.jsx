import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Privacy Policy | Karvia",
  description: "Karvia privacy policy — how we collect, use, and protect your data.",
};

function Section({ num, hi, en, children }) {
  return (
    <div className="bg-white rounded-3xl border-2 border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-8 h-8 rounded-xl bg-brand-navy text-white font-black text-sm flex items-center justify-center flex-shrink-0">
          {num}
        </span>
        <div>
          <h2
            className="font-black text-brand-navy"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            {hi}
          </h2>
          <p className="text-gray-500 text-xs">{en}</p>
        </div>
      </div>
      <div className="text-gray-500 text-sm leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-10 space-y-5">

        <div>
          <h1
            className="text-3xl font-black text-brand-navy"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            Privacy Policy / गोपनीयता नीति
          </h1>
          <p className="text-gray-500 text-sm mt-1">Last updated: January 2025</p>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl px-5 py-4">
          <p
            className="text-blue-600 text-sm"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            Karvia आपकी privacy की परवाह करता है। यह नीति बताती है कि हम आपका data कैसे collect, use और protect करते हैं।
          </p>
          <p className="text-blue-700 text-xs mt-1">
            Karvia cares about your privacy. This policy explains how we collect, use, and protect your data.
          </p>
        </div>

        <Section num="1" hi="हम क्या जानकारी लेते हैं" en="Information We Collect">
          <p style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            हम निम्नलिखित जानकारी collect करते हैं:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Mobile number (OTP verification के लिए / for OTP verification)</li>
            <li>Name, location, category, and service details (workers)</li>
            <li>Job request details (clients)</li>
            <li>Shop name, category, and ad content (shops)</li>
            <li>Device information and app usage analytics</li>
          </ul>
          <p className="mt-2">We do not collect passwords — authentication is done via OTP only.</p>
        </Section>

        <Section num="2" hi="जानकारी का उपयोग" en="How We Use Your Information">
          <p style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            आपकी जानकारी इन कामों के लिए use होती है:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Workers और clients को match करने के लिए</li>
            <li>Job alerts और notifications भेजने के लिए</li>
            <li>Platform को improve करने के लिए</li>
            <li>Fraud prevention and platform security</li>
            <li>Subscription and payment management</li>
          </ul>
          <p className="mt-2">We never sell your personal data to third parties.</p>
        </Section>

        <Section num="3" hi="Data सुरक्षा" en="Data Security">
          <p style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            आपका data secure रखने के लिए हम ये measures use करते हैं:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>HTTPS encryption for all data in transit</li>
            <li>OTP-only authentication — no stored passwords</li>
            <li>Server-side session management</li>
            <li>Regular security audits</li>
          </ul>
        </Section>

        <Section num="4" hi="Call Records" en="Call Records &amp; Communication Logs">
          <p style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            Platform के through की गई calls के basic logs हम record करते हैं (time, duration) — call content नहीं।
            यह fraud prevention और dispute resolution के लिए है।
          </p>
          <p className="mt-2">
            We log basic call metadata (time, duration) for fraud prevention and dispute resolution.
            We do not record or store the content of any calls.
          </p>
        </Section>

        <Section num="5" hi="सहमति" en="Consent &amp; Your Rights">
          <p style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            Karvia use करके आप इस privacy policy से सहमत होते हैं। आपके अधिकार:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>अपना account और data delete करवाने का अधिकार</li>
            <li>Right to access your personal data</li>
            <li>Right to correction of inaccurate data</li>
            <li>Right to opt out of marketing communications</li>
          </ul>
          <p className="mt-2">
            To exercise these rights, contact us at{" "}
            <span className="text-blue-600 font-semibold">privacy@kaamsetu.in</span>
          </p>
        </Section>

        <p className="text-center text-gray-500 text-xs pb-4">
          This privacy policy is subject to change. Continued use of Karvia implies acceptance of the latest version.
        </p>

      </main>
      <Footer />
    </div>
  );
}
