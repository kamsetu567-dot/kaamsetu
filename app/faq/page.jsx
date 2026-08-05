"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useT } from "@/lib/i18n/useT";

const FAQS = [
  {
    q: { hi: "Karvia क्या है?", en: "What is Karvia?" },
    a: { hi: "Karvia एक ऑनलाइन प्लेटफॉर्म है जहाँ आप मिस्त्री, प्लंबर, DJ, ट्यूटर जैसे workers को 5-30 सेकंड में खोज सकते हैं।", en: "Karvia is an online platform where you can find workers like Mistri, Plumber, DJ, Tutor in 5-30 seconds." },
  },
  {
    q: { hi: "वर्कर बनने के लिए क्या चाहिए?", en: "What is needed to become a worker?" },
    a: { hi: "मोबाइल नंबर, Aadhaar card, और ₹199/month subscription fee।", en: "Mobile number, Aadhaar card, and ₹199/month subscription fee." },
  },
  {
    q: { hi: "क्या Karvia फ्री है?", en: "Is Karvia free?" },
    a: { hi: "Clients के लिए बिल्कुल फ्री है। Workers के लिए ₹199/month subscription है।", en: "Completely free for clients. Workers pay a ₹199/month subscription." },
  },
  {
    q: { hi: "क्या Workers verified हैं?", en: "Are workers verified?" },
    a: { hi: "हाँ, सभी workers का Aadhaar verification होता है और admin approval मिलती है।", en: "Yes, all workers go through Aadhaar verification and receive admin approval." },
  },
  {
    q: { hi: "Job accept करने पर क्या होता है?", en: "What happens when a job is accepted?" },
    a: { hi: "पहला worker जो job accept करता है उसे client का नंबर मिलता है। बाकी workers को \"Job already taken\" दिखता है।", en: "The first worker to accept gets the client's number. Other workers see \"Job already taken\"." },
  },
  {
    q: { hi: "Payment कैसे होती है?", en: "How does payment work?" },
    a: { hi: "Worker subscription payment UPI/QR Code या Razorpay से होती है।", en: "Worker subscription payment is done via UPI/QR Code or Razorpay." },
  },
  {
    q: { hi: "शिकायत कहाँ करें?", en: "Where to file a complaint?" },
    a: { hi: "support@karvia.services या +91 9690993056 पर संपर्क करें।", en: "Contact support@karvia.services or +91 9690993056." },
  },
];

function FAQItem({ faq, open, onToggle }) {
  const t = useT();
  return (
    <div className={`bg-white rounded-2xl border-2 transition-colors ${open ? "border-brand-navy" : "border-gray-100"}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-3"
        aria-expanded={open}
      >
        <span className="font-bold text-brand-navy font-hindi text-sm leading-snug">{t(faq.q)}</span>
        <ChevronDown
          size={18}
          className={`flex-shrink-0 text-brand-navy transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-gray-600 text-sm font-hindi leading-relaxed border-t border-gray-100 pt-3">
            {t(faq.a)}
          </p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const t = useT();
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      <Header />

      {/* Hero */}
      <div className="bg-brand-navy px-4 py-10 text-center">
        <div className="w-14 h-14 bg-brand-yellow rounded-2xl flex items-center justify-center mx-auto mb-4">
          <HelpCircle size={26} className="text-brand-navy" />
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white font-hindi mb-1">
          {t({ hi: "अक्सर पूछे जाने वाले सवाल", en: "Frequently Asked Questions" })}
        </h1>
        <p className="text-white/60 text-sm">FAQ — Frequently Asked Questions</p>
      </div>

      <main className="flex-1 max-w-2xl mx-auto px-4 py-10 w-full space-y-3">
        {FAQS.map((faq, i) => (
          <FAQItem
            key={i}
            faq={faq}
            open={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
          />
        ))}

        <div className="bg-brand-navy rounded-2xl p-5 text-center mt-6">
          <p className="text-white font-hindi font-bold mb-1">
            {t({ hi: "और सवाल हैं?", en: "Have more questions?" })}
          </p>
          <p className="text-white/60 text-sm font-hindi">
            {t({ hi: "हमसे संपर्क करें", en: "Contact us" })}
            {" — support@karvia.services"}
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
