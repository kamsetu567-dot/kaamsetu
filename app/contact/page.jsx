"use client";

import { useState } from "react";
import { Phone, Mail, Clock, Send, CheckCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useT } from "@/lib/i18n/useT";

const SUBJECTS = [
  { hi: "शिकायत",     en: "Complaint" },
  { hi: "सुझाव",      en: "Suggestion" },
  { hi: "वर्कर बनें", en: "Become a Worker" },
  { hi: "दुकान जोड़ें", en: "Add Shop" },
  { hi: "अन्य",       en: "Other" },
];

export default function ContactPage() {
  const t = useT();
  const [form, setForm] = useState({ name: "", mobile: "", subject: "", message: "" });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  function validate() {
    const e = {};
    if (form.name.trim().length < 2)
      e.name = { hi: "नाम कम से कम 2 अक्षर का होना चाहिए", en: "Name must be at least 2 characters" };
    if (!/^[6-9]\d{9}$/.test(form.mobile))
      e.mobile = { hi: "सही मोबाइल नंबर डालें", en: "Enter a valid 10-digit mobile number" };
    if (!form.subject)
      e.subject = { hi: "कृपया एक विकल्प चुनें", en: "Please select an option" };
    if (form.message.trim().length < 5)
      e.message = { hi: "संदेश लिखें", en: "Please enter a message" };
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitted(true);
    setForm({ name: "", mobile: "", subject: "", message: "" });
    setErrors({});
  }

  function field(key, value, onChange) {
    return (
      <>
        {value}
        {errors[key] && (
          <p className="text-red-500 text-xs mt-1 font-hindi">
            {t(errors[key])}
          </p>
        )}
      </>
    );
  }

  const inputCls = (key) =>
    `w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-brand-navy text-sm font-hindi min-h-[48px] ${
      errors[key] ? "border-red-400" : "border-gray-200"
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      <Header />

      {/* Hero */}
      <div className="bg-brand-navy px-4 py-10 text-center">
        <h1 className="text-2xl md:text-3xl font-black text-white font-hindi mb-1">
          संपर्क करें
        </h1>
        <p className="text-white/60 text-sm">Get in Touch — Contact Us</p>
      </div>

      <main className="flex-1 max-w-5xl mx-auto px-4 py-10 w-full">
        <div className="grid md:grid-cols-2 gap-8">

          {/* Left — contact info */}
          <div className="space-y-4">
            <h2 className="text-lg font-black text-brand-navy font-hindi mb-5">
              हमसे जुड़ें / Reach Us
            </h2>

            {[
              {
                icon: Phone, color: "bg-blue-50 text-brand-navy",
                label: { hi: "फोन", en: "Phone" },
                value: "+91 9876543210",
              },
              {
                icon: Mail, color: "bg-yellow-50 text-yellow-700",
                label: { hi: "ईमेल", en: "Email" },
                value: "support@karvia.com",
              },
              {
                icon: Clock, color: "bg-green-50 text-green-700",
                label: { hi: "समय", en: "Hours" },
                value: { hi: "सोमवार–शनिवार, सुबह 9 बजे – शाम 6 बजे", en: "Mon–Sat, 9am – 6pm" },
              },
            ].map((item) => (
              <div key={item.value} className="bg-white rounded-2xl border-2 border-gray-100 p-5 flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  <item.icon size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-hindi">{t(item.label)}</p>
                  <p className="font-bold text-brand-navy font-hindi text-sm">
                    {typeof item.value === "object" ? t(item.value) : item.value}
                  </p>
                </div>
              </div>
            ))}

            <div className="bg-brand-navy rounded-2xl p-5 text-white mt-4">
              <p className="font-black text-brand-yellow font-hindi mb-1">Karvia Support</p>
              <p className="text-white/70 text-sm font-hindi">
                किसी भी समस्या के लिए हमें संपर्क करें।
              </p>
              <p className="text-white/50 text-xs mt-1">
                We&apos;re here to help — reach out anytime.
              </p>
            </div>
          </div>

          {/* Right — form */}
          <div className="bg-white rounded-3xl border-2 border-gray-100 p-6 shadow-sm">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle size={56} className="text-green-500 mb-4" />
                <h3 className="text-xl font-black text-brand-navy font-hindi mb-1">
                  संदेश मिल गया!
                </h3>
                <p className="text-gray-500 font-hindi text-sm">
                  आपका संदेश मिल गया! जल्द संपर्क करेंगे।
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Message received! We&apos;ll get back to you soon.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 bg-brand-navy text-white font-bold px-6 py-2.5 rounded-xl text-sm font-hindi hover:opacity-90 transition-opacity"
                >
                  नया संदेश भेजें / Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-black text-brand-navy font-hindi text-lg mb-5">
                  संदेश भेजें / Send Message
                </h3>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">नाम *</label>
                  {field("name",
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="आपका नाम / Your Name"
                      className={inputCls("name")}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">मोबाइल नंबर *</label>
                  {field("mobile",
                    <input
                      type="tel"
                      maxLength={10}
                      value={form.mobile}
                      onChange={e => setForm(f => ({ ...f, mobile: e.target.value.replace(/\D/g, "") }))}
                      placeholder="10 अंकों का नंबर"
                      className={inputCls("mobile")}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">विषय *</label>
                  {field("subject",
                    <select
                      value={form.subject}
                      onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      className={`${inputCls("subject")} bg-white`}
                    >
                      <option value="">-- विषय चुनें --</option>
                      {SUBJECTS.map(s => (
                        <option key={s.en} value={s.en}>{t(s)}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-hindi">संदेश *</label>
                  {field("message",
                    <textarea
                      rows={4}
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="अपना संदेश लिखें / Write your message..."
                      className={`${inputCls("message")} resize-none`}
                    />
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-navy text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity font-hindi leading-none min-h-[48px]"
                >
                  <Send size={16} />
                  संदेश भेजें / Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
