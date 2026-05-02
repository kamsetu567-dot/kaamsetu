"use client";

import { useState } from "react";
import { Share2, Copy, Users, Gift, CheckCircle } from "lucide-react";
import EmptyState from "@/components/EmptyState";

export default function WorkerReferralsPage() {
  const [copied, setCopied] = useState(false);

  // TODO: Persist via API when backend is ready — generate real referral link from backend
  const referralCode = "KAAM-XXXX"; // placeholder
  const referralLink = `https://kaamsetu.in/ref/${referralCode}`;
  const referrals = [];
  const earnings = 0;

  function copyLink() {
    navigator.clipboard?.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function shareLink() {
    if (navigator.share) {
      navigator.share({
        title: "KaamSetu — काम ढूंढो",
        text: "मेरे referral link से KaamSetu join करें और ₹20–₹50 पाएं!",
        url: referralLink,
      });
    } else {
      copyLink();
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2
          className="text-xl font-black text-text-primary"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          रेफरल प्रोग्राम
        </h2>
        <p className="text-text-secondary text-sm mt-0.5">Referral Program — Earn ₹20–₹50 per referral</p>
      </div>

      {/* Earnings summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-primary-green">₹{earnings}</p>
          <p
            className="text-green-700 text-sm mt-1 font-semibold"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            कुल कमाई
          </p>
          <p className="text-green-600 text-xs">Total Earned</p>
        </div>
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-primary-blue">{referrals.length}</p>
          <p
            className="text-primary-blue text-sm mt-1 font-semibold"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            कुल Referrals
          </p>
          <p className="text-blue-600 text-xs">Total Referrals</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-3xl border-2 border-border-light p-5">
        <h3
          className="font-black text-text-primary mb-3"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          कैसे काम करता है? / How It Works
        </h3>
        <div className="space-y-3">
          {[
            { step: "1", hi: "अपना link share करें", en: "Share your referral link" },
            { step: "2", hi: "दोस्त KaamSetu join करे", en: "Friend signs up via your link" },
            { step: "3", hi: "₹20–₹50 आपको मिलेंगे", en: "You earn ₹20–₹50 per signup" },
          ].map(s => (
            <div key={s.step} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent-yellow text-primary-navy rounded-full flex items-center justify-center font-black text-sm flex-shrink-0">
                {s.step}
              </div>
              <div>
                <p
                  className="font-semibold text-text-primary text-sm"
                  style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                >
                  {s.hi}
                </p>
                <p className="text-text-secondary text-xs">{s.en}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referral link */}
      <div className="bg-white rounded-3xl border-2 border-border-light p-5">
        <h3
          className="font-black text-text-primary mb-3"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          आपका Referral Link
        </h3>
        <div className="flex items-center gap-2 bg-neutral-bg border-2 border-border-light rounded-xl px-4 py-3 mb-4">
          <p className="flex-1 text-sm text-text-secondary truncate">{referralLink}</p>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 bg-primary-blue text-white text-sm font-bold px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
            aria-label="Copy referral link"
          >
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <button
          onClick={shareLink}
          className="w-full flex items-center justify-center gap-2 bg-primary-green text-white font-black text-lg py-4 rounded-2xl hover:bg-green-700 transition-colors min-h-14"
          aria-label="Share referral link"
        >
          <Share2 size={20} />
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>Link Share करें</span>
          <span className="text-sm font-normal">/ Share Now</span>
        </button>
      </div>

      {/* Referral list */}
      <div className="bg-white rounded-3xl border-2 border-border-light p-5">
        <h3
          className="font-bold text-text-primary mb-3"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          मेरे Referrals / My Referrals
        </h3>
        {referrals.length === 0 ? (
          <EmptyState
            icon="workers"
            titleHi="अभी कोई Referral नहीं"
            titleEn="No referrals yet"
            descHi="अपना link share करें और कमाई शुरू करें!"
            descEn="Share your link and start earning!"
          />
        ) : (
          <div className="space-y-3">
            {referrals.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
                <div>
                  <p className="font-semibold text-text-primary">{r.name}</p>
                  <p className="text-text-secondary text-xs">{r.date}</p>
                </div>
                <span className="text-primary-green font-bold">+₹{r.reward}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
