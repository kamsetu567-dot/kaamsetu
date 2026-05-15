"use client";

import { useState } from "react";
import { Shield, Ban, AlertTriangle, CheckCircle, X, PlusCircle } from "lucide-react";

export default function AdminSecurityPage() {
  // TODO: Persist all security settings via API when backend is ready
  const [adminOtp,    setAdminOtp]    = useState(true);
  const [idVerify,    setIdVerify]    = useState(false);
  const [fraudInput,  setFraudInput]  = useState("");
  const [fraudList,   setFraudList]   = useState([]);
  const [savedMsg,    setSavedMsg]    = useState("");

  function addFraud() {
    const val = fraudInput.trim();
    if (!val || fraudList.includes(val)) return;
    setFraudList(prev => [...prev, val]);
    setFraudInput("");
  }

  function removeFraud(item) {
    setFraudList(prev => prev.filter(i => i !== item));
  }

  function saveSettings() {
    // TODO: Call updateSettings({ adminOtp, idVerify, fraudList }) when backend is ready
    setSavedMsg("Settings saved!");
    setTimeout(() => setSavedMsg(""), 3000);
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
          सुरक्षा / Security
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Platform security toggles and fraud management</p>
      </div>

      {/* Toggles */}
      <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 space-y-4">
        <h2
          className="font-black text-brand-navy flex items-center gap-2"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          <Shield size={18} className="text-brand-navy" />
          Security Settings
        </h2>

        {[
          {
            key: "adminOtp",
            hi: "Admin OTP Login",
            en: "Require OTP to log into admin panel",
            value: adminOtp,
            onChange: () => setAdminOtp(v => !v),
          },
          {
            key: "idVerify",
            hi: "Worker ID Verification",
            en: "Require Aadhaar/ID verification before approval",
            value: idVerify,
            onChange: () => setIdVerify(v => !v),
          },
        ].map(t => (
          <div key={t.key} className="flex items-center justify-between gap-4 py-2 border-b border-gray-200 last:border-0">
            <div>
              <p
                className="font-semibold text-brand-navy"
                style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
              >
                {t.hi}
              </p>
              <p className="text-gray-500 text-xs">{t.en}</p>
            </div>
            <Toggle enabled={t.value} onToggle={t.onChange} />
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
          Fraud Block List / ब्लॉक सूची
        </h2>
        <p className="text-gray-500 text-xs mb-4">
          Blocked mobile numbers or user IDs — these users cannot register or log in.
        </p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={fraudInput}
            onChange={e => setFraudInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addFraud()}
            placeholder="Mobile number or User ID"
            className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 transition-colors"
          />
          <button
            onClick={addFraud}
            className="flex items-center gap-1.5 bg-red-500 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-red-600 transition-colors text-sm"
          >
            <PlusCircle size={15} />
            Block
          </button>
        </div>

        {fraudList.length === 0 ? (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
            <p className="text-green-700 text-sm">No blocked users. Block list is empty.</p>
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
                  aria-label={`Unblock ${item}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 bg-yellow-50 border-2 border-accent-yellow rounded-2xl px-4 py-3">
        <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
        <p className="text-yellow-700 text-sm">
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            Security settings backend ready होने के बाद persist होंगे।
          </span>
          {" / Changes will persist once the backend is connected."}
        </p>
      </div>

      {/* Save */}
      <button
        onClick={saveSettings}
        className="flex items-center gap-2 bg-brand-navy text-white font-black px-8 py-3.5 rounded-2xl hover:bg-blue-900 transition-colors"
      >
        {savedMsg ? <CheckCircle size={18} /> : <Shield size={18} />}
        {savedMsg || "Save Security Settings / सहेजें"}
      </button>
    </div>
  );
}
