import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Terms & Conditions | Karvia",
  description: "Karvia terms and conditions of use.",
};

function Section({ num, hi, en, children }) {
  return (
    <div className="bg-white rounded-3xl border-2 border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-8 h-8 rounded-xl bg-orange-500 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
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
      <div className="text-gray-500 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-10 space-y-5">

        <div>
          <h1
            className="text-3xl font-black text-brand-navy"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            नियम और शर्तें / Terms &amp; Conditions
          </h1>
          <p className="text-gray-500 text-sm mt-1">Last updated: January 2025</p>
        </div>

        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl px-5 py-4">
          <p
            className="text-orange-500 text-sm"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            Karvia use करके आप इन नियमों और शर्तों से सहमत होते हैं। कृपया ध्यान से पढ़ें।
          </p>
          <p className="text-orange-700 text-xs mt-1">
            By using Karvia, you agree to these terms and conditions. Please read carefully.
          </p>
        </div>

        <Section num="1" hi="Platform का उपयोग" en="Use of Platform">
          <p style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            Karvia केवल 18 वर्ष से अधिक आयु के व्यक्तियों के लिए है। Platform का उपयोग केवल legal और ethical
            कार्यों के लिए किया जाना चाहिए। Fraudulent या misleading profiles बनाना prohibited है।
          </p>
          <p className="mt-2">
            Karvia is for users 18+ only. The platform must be used for legal and ethical purposes only.
            Creating fraudulent or misleading profiles is strictly prohibited.
          </p>
        </Section>

        <Section num="2" hi="Worker की जिम्मेदारी" en="Worker Responsibilities">
          <ul className="list-disc list-inside space-y-1" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            <li>सही और सत्य जानकारी provide करें</li>
            <li>Clients के साथ respectfully behave करें</li>
            <li>Agreed service और rate पर काम करें</li>
            <li>Platform rules का पालन करें</li>
          </ul>
          <p className="mt-2 text-xs">
            Workers must provide accurate information, behave respectfully, and follow agreed service terms.
          </p>
        </Section>

        <Section num="3" hi="Client की जिम्मेदारी" en="Client Responsibilities">
          <p style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            Clients को workers के साथ respectfully deal करना होगा। Fake job requests डालना prohibited है।
            Karvia payments का mediator नहीं है — payment directly worker को की जाती है।
          </p>
          <p className="mt-2 text-xs">
            Clients must interact respectfully with workers. Fake job requests are prohibited.
            Karvia is not a payment mediator — payments are made directly to workers.
          </p>
        </Section>

        <Section num="4" hi="Subscription और Payment" en="Subscription &amp; Payment">
          <p style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            Worker subscription fees non-refundable हैं। Subscription expire होने के बाद profile hide हो जाती है।
            Renewal के लिए payment required है। Karvia pricing कभी भी change कर सकता है।
          </p>
          <p className="mt-2 text-xs">
            Worker subscription fees are non-refundable. Profiles are hidden after subscription expiry.
            Karvia reserves the right to change pricing at any time.
          </p>
        </Section>

        <Section num="5" hi="Liability की सीमा" en="Limitation of Liability">
          <p style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            Karvia केवल एक connecting platform है। Workers और clients के बीच किसी भी विवाद के लिए
            Karvia responsible नहीं है। Service quality, payment disputes, या personal safety के लिए
            users खुद जिम्मेदार हैं।
          </p>
          <p className="mt-2 text-xs">
            Karvia is a connecting platform only and is not liable for disputes between workers and clients,
            service quality, payment issues, or personal safety.
          </p>
        </Section>

        <p className="text-center text-gray-500 text-xs pb-4">
          Karvia reserves the right to modify these terms at any time. Continued use constitutes acceptance.
        </p>

      </main>
      <Footer />
    </div>
  );
}
