"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Users, Target, Heart, Wrench } from "lucide-react";
import { useT } from "@/lib/i18n/useT";

export default function AboutPage() {
  const t = useT();
  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-brand-navy rounded-2xl flex items-center justify-center mx-auto">
            <Wrench size={28} className="text-brand-yellow" />
          </div>
          <h1
            className="text-3xl font-black text-brand-navy"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            {t({ hi: 'Karvia के बारे में', en: 'About Karvia' })}
          </h1>
        </div>

        {/* Mission */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Target size={20} className="text-white" />
            </div>
            <h2
              className="text-xl font-black text-brand-navy"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              {t({ hi: 'हमारा उद्देश्य', en: 'Our Mission' })}
            </h2>
          </div>
          <p
            className="text-gray-500 leading-relaxed"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            {t({
              hi: 'Karvia एक Hindi-first डिजिटल platform है जो skilled workers और clients को connect करता है। हमारा लक्ष्य है कि हर कारीगर, मज़दूर, और service provider को digital economy का हिस्सा बनाया जाए — बिना किसी भाषा barrier के।',
              en: "Karvia is a Hindi-first digital platform connecting skilled service providers with clients across India. Our mission is to bring every artisan, laborer, and service professional into the digital economy — without any language barrier.",
            })}
          </p>
        </div>

        {/* What we do */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users size={20} className="text-white" />
            </div>
            <h2
              className="text-xl font-black text-brand-navy"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              {t({ hi: 'हम क्या करते हैं', en: 'What We Do' })}
            </h2>
          </div>
          <div className="space-y-3">
            {[
              { hi: "Workers को काम मिलता है", en: "Workers find local jobs quickly and reliably." },
              { hi: "Clients को सही कारीगर मिलते हैं", en: "Clients connect with trusted, nearby service providers." },
              { hi: "Shops अपने customers तक पहुँचते हैं", en: "Local shops run ads to reach more customers." },
              { hi: "Hindi में आसान interface", en: "Bilingual interface in Hindi and English for everyone." },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-yellow text-brand-navy text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <p
                    className="font-semibold text-brand-navy"
                    style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                  >
                    {t(item)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="bg-brand-navy rounded-3xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Heart size={20} className="text-brand-yellow" />
            <h2
              className="text-xl font-black"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              {t({ hi: 'हमारे मूल्य', en: 'Our Values' })}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { hi: "विश्वास",    en: "Trust",       desc: { hi: 'सत्यापित प्रोफाइल, सच्ची समीक्षाएँ।', en: 'Verified profiles, honest reviews.' } },
              { hi: "सुविधा",    en: "Convenience", desc: { hi: 'सभी लोकल सेवाओं के लिए एक ऐप।', en: 'One app for all local services.' } },
              { hi: "समावेश",    en: "Inclusion",   desc: { hi: 'Hindi-first, सरल भाषा वाले इंटरफ़ेस।', en: 'Hindi-first, low-literacy friendly.' } },
            ].map(v => (
              <div key={v.en} className="bg-white/10 rounded-2xl p-4">
                <p
                  className="font-black text-brand-yellow text-lg"
                  style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                >
                  {t({ hi: v.hi, en: v.en })}
                </p>
                <p className="text-white/60 text-xs mt-1">{t(v.desc)}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm">
          {t({ hi: 'सवाल हैं? हमें यहाँ संपर्क करें', en: 'Questions? Contact us at' })}{" "}
          <span className="text-blue-600 font-semibold">support@karvia.in</span>
        </p>

      </main>
      <Footer />
    </div>
  );
}
