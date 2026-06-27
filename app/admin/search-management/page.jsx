"use client";

import { useState, useEffect } from "react";
import { Search, PlusCircle, X, TrendingUp } from "lucide-react";
import { useT } from "@/lib/i18n/useT";

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("kaamsetu_admin_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminSearchManagementPage() {
  const t = useT();
  // Each keyword is {id, keyword}. We surface .keyword text in the UI but
  // need the id for the DELETE call so the chip remove button knows what
  // to target.
  const [keywords, setKeywords] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/search-keywords", { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d?.keywords)) setKeywords(d.keywords); })
      .catch(() => {});
  }, []);

  async function addKeyword() {
    const kw = input.trim().toLowerCase();
    if (!kw) { setError(t({ hi: 'Keyword खाली नहीं हो सकता', en: 'Keyword cannot be empty' })); return; }
    if (keywords.some(k => k.keyword === kw)) { setError(t({ hi: 'यह Keyword पहले से है', en: 'Keyword already exists' })); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/search-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ keyword: kw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || t({ hi: 'जोड़ नहीं पाए', en: 'Could not add' }));
        return;
      }
      setKeywords(prev => [data.keyword, ...prev]);
      setInput("");
      setError("");
    } catch {
      setError(t({ hi: 'नेटवर्क error', en: 'Network error' }));
    } finally {
      setBusy(false);
    }
  }

  async function removeKeyword(id) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/search-keywords/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) setKeywords(prev => prev.filter(k => k.id !== id));
    } catch {} finally {
      setBusy(false);
    }
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
            disabled={busy}
            className="bg-green-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
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
          {keywords.map(k => (
            <span
              key={k.id}
              className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-200 text-sm font-semibold px-3 py-1.5 rounded-full"
            >
              {k.keyword}
              <button
                onClick={() => removeKeyword(k.id)}
                disabled={busy}
                className="text-blue-400 hover:text-red-500 transition-colors ml-0.5 disabled:opacity-50"
                aria-label={t({ hi: `Keyword हटाएँ: ${k.keyword}`, en: `Remove keyword: ${k.keyword}` })}
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
