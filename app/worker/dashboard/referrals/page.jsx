"use client";

import { useState, useEffect } from "react";
import { Share2, Copy, Gift, CheckCircle, Clock, Ticket } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { apiGet, apiPost } from "@/lib/api/client";
import { useToast } from "@/components/Toast";
import { useRoleGuard } from "@/lib/auth/useRoleGuard";

const HINDI = { fontFamily: "var(--font-noto-devanagari), sans-serif" };

export default function WorkerReferralsPage() {
  useRoleGuard("worker");
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      setData(await apiGet("/api/referrals"));
    } catch (err) {
      toast.error(err?.message || "Could not load referrals");
    } finally {
      setLoading(false);
    }
  }

  const code = data?.code || "";
  const days = data?.rewardDays ?? 10;
  const shareText =
    `Karvia पर काम पाएं! मेरा referral code "${code}" अपने dashboard के Referral section में डालें — ` +
    `हम दोनों को ${days} दिन की FREE subscription मिलेगी.`;

  function copyCode() {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function shareCode() {
    if (navigator.share) {
      navigator.share({ title: "Karvia — काम ढूंढो", text: shareText }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(shareText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        toast.success("Message copy हो गया / Message copied");
      });
    }
  }

  async function redeem(e) {
    e.preventDefault();
    if (redeeming || !codeInput.trim()) return;
    setRedeeming(true);
    try {
      const res = await apiPost("/api/referrals/redeem", { code: codeInput });
      toast.success(res.message);
      setCodeInput("");
      await load();
    } catch (err) {
      toast.error(err?.message || "Code apply नहीं हो सका / Could not apply code");
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-brand-navy" style={HINDI}>रेफरल प्रोग्राम</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Referral Program — you and your friend each get {days} days free
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton type="card" count={3} />
      ) : (
        <>
          {/* Earned summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 text-center">
              <p className="text-3xl font-black text-green-600">{data?.daysEarned ?? 0}</p>
              <p className="text-green-700 text-sm mt-1 font-semibold" style={HINDI}>दिन कमाए</p>
              <p className="text-green-600 text-xs">Free days earned</p>
            </div>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 text-center">
              <p className="text-3xl font-black text-blue-600">{data?.rewardedCount ?? 0}</p>
              <p className="text-blue-600 text-sm mt-1 font-semibold" style={HINDI}>सफल Referrals</p>
              <p className="text-blue-600 text-xs">of {data?.cap ?? 10} max</p>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5">
            <h3 className="font-black text-brand-navy mb-3" style={HINDI}>कैसे काम करता है? / How It Works</h3>
            <div className="space-y-3">
              {[
                { step: "1", hi: "अपना code दोस्त को भेजें", en: "Send your code to a friend" },
                { step: "2", hi: "वो अपने dashboard में code डाले", en: "They enter it in their dashboard" },
                { step: "3", hi: `Admin approve करे — दोनों को ${days} दिन FREE`, en: `Once admin approves them, you BOTH get ${days} free days` },
              ].map(s => (
                <div key={s.step} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-yellow text-brand-navy rounded-full flex items-center justify-center font-black text-sm flex-shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <p className="font-semibold text-brand-navy text-sm" style={HINDI}>{s.hi}</p>
                    <p className="text-gray-500 text-xs">{s.en}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Your code */}
          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5">
            <h3 className="font-black text-brand-navy mb-3" style={HINDI}>आपका Referral Code</h3>
            <div className="flex items-center gap-2 bg-brand-bg border-2 border-dashed border-brand-navy/30 rounded-xl px-4 py-4 mb-4">
              <p className="flex-1 text-2xl font-black text-brand-navy tracking-widest text-center select-all">
                {code || "—"}
              </p>
              <button onClick={copyCode} disabled={!code}
                className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-bold px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0 disabled:opacity-50"
                aria-label="Copy referral code">
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <button onClick={shareCode} disabled={!code}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-black text-lg py-4 rounded-2xl hover:bg-green-700 transition-colors min-h-14 disabled:opacity-50"
              aria-label="Share referral code">
              <Share2 size={20} />
              <span style={HINDI}>Code Share करें</span>
              <span className="text-sm font-normal">/ Share Now</span>
            </button>
          </div>

          {/* Enter a friend's code — one-shot */}
          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5">
            <h3 className="font-black text-brand-navy mb-1 flex items-center gap-2" style={HINDI}>
              <Ticket size={18} className="text-purple-600" />
              दोस्त का Code डालें
            </h3>
            <p className="text-gray-500 text-xs mb-3">
              Got a code from a friend? Enter it to get {days} free days.
            </p>

            {data?.hasRedeemed ? (
              <div className="flex items-center gap-3 bg-green-50 border-2 border-green-200 rounded-2xl px-4 py-3">
                <Gift size={20} className="text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-green-700 text-sm" style={HINDI}>
                    Code लग चुका है{data?.referredBy?.name ? ` — ${data.referredBy.name}` : ""}
                  </p>
                  <p className="text-green-600 text-xs">
                    {data?.referredBy?.code ? `Used code ${data.referredBy.code}. ` : ""}
                    A referral code can only be used once.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={redeem} className="flex flex-col sm:flex-row gap-2">
                <input
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="KAAM-XXXXXX"
                  className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3.5 text-base font-bold tracking-wider uppercase focus:outline-none focus:border-brand-navy"
                  aria-label="Friend's referral code"
                />
                <button type="submit" disabled={redeeming || !codeInput.trim()}
                  className="bg-brand-navy text-white font-bold px-6 py-3.5 rounded-xl disabled:opacity-50 whitespace-nowrap min-h-0">
                  {redeeming ? "Applying…" : "Apply"}
                </button>
              </form>
            )}
          </div>

          {/* My referrals */}
          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5">
            <h3 className="font-bold text-brand-navy mb-3" style={HINDI}>मेरे Referrals / My Referrals</h3>
            {!data?.referrals?.length ? (
              <EmptyState
                icon="workers"
                titleHi="अभी कोई Referral नहीं"
                titleEn="No referrals yet"
                descHi="अपना code share करें और फ्री दिन कमाएं!"
                descEn="Share your code and start earning free days!"
              />
            ) : (
              <div className="space-y-3">
                {data.referrals.map(r => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                    <div className="min-w-0">
                      <p className="font-semibold text-brand-navy truncate">{r.name}</p>
                      <p className="text-gray-500 text-xs">
                        {r.joinedAt ? new Date(r.joinedAt).toLocaleDateString("en-IN") : ""}
                      </p>
                    </div>
                    {r.rewarded ? (
                      <span className="flex items-center gap-1 text-green-600 font-bold text-sm flex-shrink-0">
                        <CheckCircle size={14} /> +{days} दिन
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-full px-2.5 py-1 text-xs font-semibold flex-shrink-0">
                        <Clock size={11} /> Approval बाकी
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
