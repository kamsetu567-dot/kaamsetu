"use client";

import { useState } from "react";
import { Search, PlusCircle, X, TrendingUp } from "lucide-react";
import { useT } from "@/lib/i18n/useT";

const INITIAL_KEYWORDS = [
  "plumber", "electrician", "carpenter", "painter", "cleaner",
  "cook", "driver", "security guard", "nurse", "teacher",
];

export default function AdminSearchManagementPage() {
  const t = useT();
  const [keywords, setKeywords] = useState(INITIAL_KEYWORDS);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  // TODO: Persist keywords via API when backend is ready

  function addKeyword() {
    const kw = input.trim().toLowerCase();
    if (!kw) { setError(t({ hi: 'Keyword खाली नहीं हो सकता', en: 'Keyword cannot be empty' })); return; }
    if (keywords.includes(kw)) { setError(t({ hi: 'यह Keyword पहले से है', en: 'Keyword already exists' })); return; }
    setKeywords(prev => [...prev, kw]);
    setInput("");
    setError("");
  }

  function removeKeyword(kw) {
    setKeywords(prev => prev.filter(k => k !== kw));
  }

  function handleKey(e) {
    if (e.key === "Enter") { e.preventDefault(); addKeyword(); }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1
          className="text-2xl font-black text-brand-navy"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          {t({ hi: 'सर्च प्रबंधन', en: 'Search Management' })}
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">{t({ hi: 'यूज़र्स को दिखाए जाने वाले सर्च कीवर्ड और ट्रेंडिंग टर्म्स मैनेज करें', en: 'Manage search keywords and trending terms shown to users' })}</p>
      </div>

      {/* Add keyword */}
      <div className="bg-white rounded-3xl border-2 border-gray-200 p-5">
        <h2
          className="font-black text-brand-navy mb-3 flex items-center gap-2"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          <PlusCircle size={18} className="text-green-600" />
          {t({ hi: 'नया Keyword जोड़ें', en: 'Add Keyword' })}
        </h2>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-brand-bg border-2 border-gray-200 rounded-xl px-4 py-2.5">
            <Search size={16} className="text-gray-500 flex-shrink-0" />
            <input
              type="text"
              value={input}
              onChange={e => { setInput(e.target.value); setError(""); }}
              onKeyDown={handleKey}
              placeholder={t({ hi: 'जैसे: plumber, electrician, दर्जी...', en: 'e.g. plumber, electrician, दर्जी...' })}
              className="flex-1 bg-transparent outline-none text-sm text-brand-navy placeholder:text-gray-500"
            />
          </div>
          <button
            onClick={addKeyword}
            className="bg-green-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors text-sm"
          >
            {t({ hi: 'जोड़ें', en: 'Add' })}
          </button>
        </div>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>

      {/* Keywords list */}
      <div className="bg-white rounded-3xl border-2 border-gray-200 p-5">
        <h2
          className="font-black text-brand-navy mb-3 flex items-center gap-2"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          <TrendingUp size={18} className="text-orange-500" />
          {t({ hi: 'सक्रिय Keywords', en: 'Active Keywords' })} ({keywords.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {keywords.map(kw => (
            <span
              key={kw}
              className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-200 text-sm font-semibold px-3 py-1.5 rounded-full"
            >
              {kw}
              <button
                onClick={() => removeKeyword(kw)}
                className="text-blue-400 hover:text-red-500 transition-colors ml-0.5"
                aria-label={t({ hi: `Keyword हटाएँ: ${kw}`, en: `Remove keyword: ${kw}` })}
              >
                <X size={13} />
              </button>
            </span>
          ))}
          {keywords.length === 0 && (
            <p className="text-gray-500 text-sm">{t({ hi: 'अभी कोई keyword नहीं। ऊपर से कुछ जोड़ें।', en: 'No keywords yet. Add some above.' })}</p>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="bg-brand-navy rounded-3xl p-5 text-white">
        <h4
          className="font-black mb-1"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          💡 {t({ hi: 'Keywords का उपयोग', en: 'How Keywords Are Used' })}
        </h4>
        <p
          className="text-white/80 text-sm"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          {t({
            hi: 'ये keywords homepage search suggestions और fuzzy search में उपयोग होते हैं।',
            en: 'These keywords appear in homepage search suggestions and improve fuzzy search results.',
          })}
        </p>
      </div>
    </div>
  );
}
