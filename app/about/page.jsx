import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Users, Target, Heart, Wrench } from "lucide-react";

export const metadata = {
  title: "About KaamSetu | हमारे बारे में",
  description: "KaamSetu — India's Hindi-first local service marketplace connecting clients with skilled workers.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-bg">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-primary-navy rounded-2xl flex items-center justify-center mx-auto">
            <Wrench size={28} className="text-accent-yellow" />
          </div>
          <h1
            className="text-3xl font-black text-text-primary"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            KaamSetu के बारे में
          </h1>
          <p className="text-text-secondary text-lg">About KaamSetu</p>
        </div>

        {/* Mission */}
        <div className="bg-white rounded-3xl border-2 border-border-light p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary-orange rounded-xl flex items-center justify-center flex-shrink-0">
              <Target size={20} className="text-white" />
            </div>
            <h2
              className="text-xl font-black text-text-primary"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              हमारा उद्देश्य / Our Mission
            </h2>
          </div>
          <p
            className="text-text-secondary leading-relaxed"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            KaamSetu एक Hindi-first डिजिटल platform है जो skilled workers और clients को connect करता है।
            हमारा लक्ष्य है कि हर कारीगर, मज़दूर, और service provider को digital economy का हिस्सा बनाया जाए
            — बिना किसी भाषा barrier के।
          </p>
          <p className="text-text-secondary leading-relaxed mt-3 text-sm">
            KaamSetu is a Hindi-first digital platform connecting skilled service providers with clients across India.
            Our mission is to bring every artisan, laborer, and service professional into the digital economy —
            without any language barrier.
          </p>
        </div>

        {/* What we do */}
        <div className="bg-white rounded-3xl border-2 border-border-light p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-green rounded-xl flex items-center justify-center flex-shrink-0">
              <Users size={20} className="text-white" />
            </div>
            <h2
              className="text-xl font-black text-text-primary"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              हम क्या करते हैं / What We Do
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
                <span className="w-6 h-6 rounded-full bg-accent-yellow text-primary-navy text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <p
                    className="font-semibold text-text-primary"
                    style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                  >
                    {item.hi}
                  </p>
                  <p className="text-text-secondary text-sm">{item.en}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="bg-primary-navy rounded-3xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Heart size={20} className="text-accent-yellow" />
            <h2
              className="text-xl font-black"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              हमारे मूल्य / Our Values
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { hi: "विश्वास",    en: "Trust",       desc: "Verified profiles, honest reviews." },
              { hi: "सुविधा",    en: "Convenience", desc: "One app for all local services."  },
              { hi: "समावेश",    en: "Inclusion",   desc: "Hindi-first, low-literacy friendly." },
            ].map(v => (
              <div key={v.en} className="bg-white/10 rounded-2xl p-4">
                <p
                  className="font-black text-accent-yellow text-lg"
                  style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                >
                  {v.hi}
                </p>
                <p className="text-white/80 text-sm font-semibold">{v.en}</p>
                <p className="text-white/60 text-xs mt-1">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-text-secondary text-sm">
          Questions? Contact us at{" "}
          <span className="text-primary-blue font-semibold">support@kaamsetu.in</span>
        </p>

      </main>
      <Footer />
    </div>
  );
}
