import { connectDB } from "@/lib/db/mongoose";
import Worker from "@/lib/models/Worker";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized, forbidden, notFound } from "@/lib/utils/apiResponse";
import { createRateLimit } from "@/lib/middleware/rateLimit";
import { normalizeCode, payoutReferralIfDue, REFERRAL_DAYS } from "@/lib/utils/referralPayout";

// Brute-force guard on code guessing. Keyed on the user (the route is behind
// auth anyway), which beats IP-keying: it survives NAT/shared connections and
// can't be sidestepped by rotating IPs.
//
// Note createRateLimit fails OPEN by design — a Mongo hiccup disables it. It's
// defence-in-depth; the real protection is that codes are 31^6 and unguessable.
const limiter = createRateLimit(15, 60 * 60 * 1000); // 15 attempts/hour per worker

export async function POST(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload) return unauthorized("Invalid or expired token");
    if (payload.role !== "worker") return forbidden("Worker access required");

    const { allowed, retryAfter } = await limiter(`referral-redeem:${payload.id}`);
    if (!allowed) return error(`बहुत ज़्यादा कोशिशें / Too many attempts. Try again in ${retryAfter}s`, 429);

    const body = await request.json();
    const code = normalizeCode(body?.code);
    if (!code) return error("कोड डालें / Enter a referral code");

    await connectDB();

    const me = await Worker.findOne({ user: payload.id }).select(
      "referredBy referralCode status subscriptionExpiry"
    );
    if (!me) return notFound("Worker profile not found");
    if (me.referredBy) {
      return error("आप पहले ही एक referral code use कर चुके हैं / You've already used a referral code");
    }
    if (me.referralCode && normalizeCode(me.referralCode) === code) {
      return error("अपना ही code use नहीं कर सकते / You can't use your own code");
    }

    const referrer = await Worker.findOne({ referralCode: code }).select("status name");
    if (!referrer) return error("गलत code / Invalid referral code");
    // Belt and braces: catches self-referral even if the code lookup and the
    // stored-code comparison above ever diverge (e.g. legacy casing).
    if (String(referrer._id) === String(me._id)) {
      return error("अपना ही code use नहीं कर सकते / You can't use your own code");
    }
    if (referrer.status === "blocked" || referrer.status === "rejected") {
      return error("यह code अब valid नहीं है / This code is no longer valid");
    }

    // Guarded update: only binds if referredBy is still unset, so a double-submit
    // can't re-attribute the referral to a second referrer.
    const bound = await Worker.findOneAndUpdate(
      { _id: me._id, referredBy: null },
      { $set: { referredBy: referrer._id } },
      { new: true }
    );
    if (!bound) {
      return error("आप पहले ही एक referral code use कर चुके हैं / You've already used a referral code");
    }

    // Normally a no-op — the reward waits for admin approval. It only fires here
    // if this worker is ALREADY approved and entered a code afterwards.
    const payout = await payoutReferralIfDue(me._id);

    return ok({
      message: payout
        ? `बधाई! ${REFERRAL_DAYS} दिन जुड़ गए / Done! ${REFERRAL_DAYS} free days added.`
        : `Code लग गया! Admin के approve करने पर ${REFERRAL_DAYS} दिन मिलेंगे / Code applied. You'll get ${REFERRAL_DAYS} free days once an admin approves your account.`,
      rewarded: !!payout,
      referrerName: referrer.name || "",
    });
  } catch (err) {
    console.error("POST /api/referrals/redeem error:", err);
    return error("Server error", 500);
  }
}
