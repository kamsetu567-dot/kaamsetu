"use client";

import { useState, useEffect } from "react";
import { Shield, Ban, AlertTriangle, CheckCircle, X, PlusCircle } from "lucide-react";
import { useT } from "@/lib/i18n/useT";

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("kaamsetu_admin_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminSecurityPage() {
  const t = useT();
  const [adminOtp,    setAdminOtp]    = useState(true);
  const [idVerify,    setIdVerify]    = useState(false);
  const [fraudInput,  setFraudInput]  = useState("");
  const [fraudList,   setFraudList]   = useState([]);
  const [savedMsg,    setSavedMsg]    = useState("");
  const [saving,      setSaving]      = useState(false);

  // Load persisted settings on mount.
  useEffect(() => {
    fetch("/api/admin/security-settings", { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        if (d?.settings) {
          setAdminOtp(!!d.settings.adminOtp);
          setIdVerify(!!d.settings.idVerify);
          setFraudList(Array.isArray(d.settings.fraudList) ? d.settings.fraudList : []);
        }
      })
      .catch(() => {});
  }, []);

  function addFraud() {
    const val = fraudInput.trim();
    if (!val || fraudList.includes(val)) return;
    setFraudList(prev => [...prev, val]);
    setFraudInput("");
  }

  function removeFraud(item) {
    setFraudList(prev => prev.filter(i => i !== item));
  }

  async function saveSettings() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/security-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ adminOtp, idVerify, fraudList }),
      });
      if (!res.ok) {
        setSavedMsg(t({ hi: 'सेव नहीं हो पाया', en: 'Could not save' }));
      } else {
        setSavedMsg(t({ hi: 'सेटिंग सहेजी गई!', en: 'Settings saved!' }));
      }
    } catch {
      setSavedMsg(t({ hi: 'नेटवर्क error', en: 'Network error' }));
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMsg(""), 3000);
    }
  }

  function Toggle({ enabled, onToggle, labelOn, labelOff }) {
    return (
      <button
        onClick={onToggle}
        className={`relative inline-flex items-center w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
          enabled ? "bg-green-600" : "bg-gray-300"
        }`}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1
          className="text-2xl font-black text-brand-navy"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          {t({ hi: 'सुरक्षा', en: 'Security' })}
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">{t({ hi: 'प्लेटफ़ॉर्म सुरक्षा टॉगल और धोखाधड़ी प्रबंधन', en: 'Platform security toggles and fraud management' })}</p>
      </div>

      {/* Toggles */}
      <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 space-y-4">
        <h2
          className="font-black text-brand-navy flex items-center gap-2"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          <Shield size={18} className="text-brand-navy" />
          {t({ hi: 'सुरक्षा सेटिंग', en: 'Security Settings' })}
        </h2>

        {[
          {
            key: "adminOtp",
            hi: "एडमिन OTP लॉगिन",
            en: "Admin OTP Login",
            descHi: "एडमिन पैनल में लॉगिन करने के लिए OTP ज़रूरी हो",
            descEn: "Require OTP to log into admin panel",
            value: adminOtp,
            onChange: () => setAdminOtp(v => !v),
          },
          {
            key: "idVerify",
            hi: "वर्कर ID वेरिफिकेशन",
            en: "Worker ID Verification",
            descHi: "अप्रूवल से पहले Aadhaar / ID वेरिफिकेशन ज़रूरी हो",
            descEn: "Require Aadhaar/ID verification before approval",
            value: idVerify,
            onChange: () => setIdVerify(v => !v),
          },
        ].map(row => (
          <div key={row.key} className="flex items-center justify-between gap-4 py-2 border-b border-gray-200 last:border-0">
            <div>
              <p
                className="font-semibold text-brand-navy"
                style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
              >
                {t({ hi: row.hi, en: row.en })}
              </p>
              <p className="text-gray-500 text-xs">{t({ hi: row.descHi, en: row.descEn })}</p>
            </div>
            <Toggle enabled={row.value} onToggle={row.onChange} />
          </div>
        ))}
      </div>

      {/* Fraud block list */}
      <div className="bg-white rounded-3xl border-2 border-gray-200 p-5">
        <h2
          className="font-black text-brand-navy mb-1 flex items-center gap-2"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          <Ban size={18} className="text-red-500" />
          {t({ hi: 'फ्रॉड ब्लॉक सूची', en: 'Fraud Block List' })}
        </h2>
        <p className="text-gray-500 text-xs mb-4">
          {t({ hi: 'ब्लॉक किए गए मोबाइल नंबर या यूज़र IDs — ये यूज़र रजिस्टर या लॉगिन नहीं कर सकते।', en: 'Blocked mobile numbers or user IDs — these users cannot register or log in.' })}
        </p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={fraudInput}
            onChange={e => setFraudInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addFraud()}
            placeholder={t({ hi: 'मोबाइल नंबर या यूज़र ID', en: 'Mobile number or User ID' })}
            className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 transition-colors"
          />
          <button
            onClick={addFraud}
            className="flex items-center gap-1.5 bg-red-500 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-red-600 transition-colors text-sm"
          >
            <PlusCircle size={15} />
            {t({ hi: 'ब्लॉक', en: 'Block' })}
          </button>
        </div>

        {fraudList.length === 0 ? (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
            <p className="text-green-700 text-sm">{t({ hi: 'कोई ब्लॉक्ड यूज़र नहीं। सूची खाली है।', en: 'No blocked users. Block list is empty.' })}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {fraudList.map(item => (
              <div
                key={item}
                className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-2.5"
              >
                <span className="font-mono text-sm text-red-700">{item}</span>
                <button
                  onClick={() => removeFraud(item)}
                  className="text-red-400 hover:text-red-600 transition-colors"
                  aria-label={t({ hi: `${item} को अनब्लॉक करें`, en: `Unblock ${item}` })}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status banner — fraud-list mobile blocks ARE enforced at signup
          and login. Admin OTP toggle is still cosmetic. */}
      <div className="flex items-start gap-3 bg-blue-50 border-2 border-blue-200 rounded-2xl px-4 py-3">
        <AlertTriangle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-blue-700 text-sm" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
          {t({
            hi: 'Fraud list में जोड़े गए mobile numbers signup और login पर block हो जाते हैं। (सिर्फ़ 10-अंकों के mobile match होते हैं; User IDs अभी नहीं।) Admin OTP toggle अभी enforce नहीं होता।',
            en: 'Mobile numbers added to the fraud list are blocked at signup and login. (Only 10-digit mobile numbers are matched — User IDs are not yet.) The Admin OTP toggle is not enforced yet.',
          })}
        </p>
      </div>

      {/* Save */}
      <button
        onClick={saveSettings}
        disabled={saving}
        className="flex items-center gap-2 bg-brand-navy text-white font-black px-8 py-3.5 rounded-2xl hover:bg-blue-900 transition-colors disabled:opacity-50"
      >
        {savedMsg ? <CheckCircle size={18} /> : <Shield size={18} />}
        {savedMsg || (saving ? t({ hi: 'सेव हो रहा है...', en: 'Saving...' }) : t({ hi: 'सुरक्षा सेटिंग सहेजें', en: 'Save Security Settings' }))}
      </button>
    </div>
  );
}
