import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AlertTriangle, Info, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Disclaimer | Karvia",
  description: "Karvia disclaimer — connecting platform notice.",
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-10 space-y-5">

        <div>
          <h1
            className="text-3xl font-black text-brand-navy"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            अस्वीकरण / Disclaimer
          </h1>
          <p className="text-gray-500 text-sm mt-1">Please read this important notice about Karvia.</p>
        </div>

        {/* Connecting platform notice */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-brand-yellow rounded-xl flex items-center justify-center flex-shrink-0">
              <Info size={20} className="text-brand-navy" />
            </div>
            <h2
              className="font-black text-brand-navy"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              Connecting Platform Notice / Platform Notice
            </h2>
          </div>
          <p
            className="text-gray-500 leading-relaxed"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            Karvia केवल एक technology platform है जो workers/service providers और clients को connect करता है।
            यह platform किसी भी worker को employ नहीं करता, और किसी भी service की quality या outcome की
            guarantee नहीं देता।
          </p>
          <p className="text-gray-500 leading-relaxed text-sm mt-3">
            Karvia is a technology platform that connects workers/service providers with clients only.
            Karvia does not employ any worker, and does not guarantee the quality or outcome of any service provided.
          </p>
        </div>

        {/* Independent contractors */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <h2
              className="font-black text-brand-navy"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              Independent Service Providers
            </h2>
          </div>
          <p
            className="text-gray-500 leading-relaxed"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            सभी workers और service providers independent contractors हैं। Karvia उनके employees नहीं हैं।
            उनके actions, work quality, या behavior के लिए Karvia legally responsible नहीं है।
          </p>
          <p className="text-gray-500 text-sm mt-3">
            All workers and service providers are independent contractors, not employees of Karvia.
            Karvia is not legally responsible for their actions, work quality, or behavior.
          </p>
        </div>

        {/* Cautions */}
        <div className="bg-yellow-50 border-2 border-accent-yellow rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0" />
            <h2
              className="font-black text-yellow-800"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              सावधानियाँ / Important Cautions
            </h2>
          </div>
          <ul className="space-y-2 text-yellow-700 text-sm">
            {[
              { hi: "Advance payment देने से बचें — सेवा पूरी होने पर भुगतान करें।", en: "Avoid advance payments — pay after service is completed." },
              { hi: "अपनी personal financial जानकारी share न करें।", en: "Do not share personal financial information with service providers." },
              { hi: "किसी भी problem के लिए platform की support team से संपर्क करें।", en: "Contact our support team for any issues or disputes." },
              { hi: "Unverified workers से सेवा लेने से पहले reviews देखें।", en: "Check reviews before hiring unverified workers." },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="font-black mt-0.5">•</span>
                <div>
                  <p style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{item.hi}</p>
                  <p className="text-yellow-600 text-xs">{item.en}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-gray-500 text-sm pb-4">
          For concerns or disputes, contact{" "}
          <span className="text-blue-600 font-semibold">support@karvia.services</span>
        </p>

      </main>
      <Footer />
    </div>
  );
}
