import { randomInt } from "crypto";
import Worker from "@/lib/models/Worker";
import { computeNewExpiry } from "@/lib/utils/subscriptionDays";
import { logger } from "@/lib/utils/logger";

// Referral rules live here so the two callers (the redeem route and the admin
// approve action) can't disagree about them.
export const REFERRAL_DAYS = 10;   // granted to BOTH sides
export const REFERRAL_CAP = 10;    // max rewarded referrals one worker can earn

// Ambiguous glyphs removed (0/O, 1/I/L) — workers read these codes aloud over
// the phone, so O-vs-0 confusion would generate support calls.
const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LEN = 6;   // 31^6 ≈ 887M — unguessable, and the rate limiter fails open

function makeCode() {
  let out = "";
  // randomInt (node:crypto) is the repo's established generator — see the job
  // start code and the OTP routes. Math.random would not be safe here.
  for (let i = 0; i < CODE_LEN; i++) out += CHARSET[randomInt(0, CHARSET.length)];
  return `KAAM-${out}`;
}

// Mints this worker's code on first use. Retries on the astronomically unlikely
// collision rather than letting the unique index throw — a duplicate-key error
// would surface to the user as a nonsense failure.
export async function ensureReferralCode(worker) {
  if (worker.referralCode) return worker.referralCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeCode();
    if (await Worker.exists({ referralCode: code })) continue;
    try {
      await Worker.updateOne({ _id: worker._id }, { $set: { referralCode: code } });
      return code;
    } catch (err) {
      if (err?.code !== 11000) throw err;   // not a collision — real failure
    }
  }
  throw new Error("Could not generate a unique referral code");
}

export function normalizeCode(raw) {
  return String(raw ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

// Grants the reward if — and only if — this referral is now due.
//
// Called from BOTH the admin approve action and the redeem route, because the
// code can be entered either before approval (the normal case: reward waits) or
// after it (reward is immediate). Safe to call speculatively; it no-ops unless
// everything lines up.
//
// Returns null when nothing was granted, else a small summary.
export async function payoutReferralIfDue(refereeId) {
  const referee = await Worker.findById(refereeId).select(
    "referredBy referralRewardedAt status subscriptionExpiry name"
  );
  if (!referee?.referredBy) return null;        // not referred by anyone
  if (referee.referralRewardedAt) return null;  // already paid
  if (referee.status !== "approved") return null; // admin hasn't vetted them yet

  // Atomically claim the payout. The flag is set BEFORE the days are granted:
  // with no transactions available, the failure mode we must avoid is granting
  // twice, so under-granting on a crash is the correct direction to fail.
  const claimed = await Worker.findOneAndUpdate(
    {
      _id: referee._id,
      referredBy: { $ne: null },
      referralRewardedAt: null,
      status: "approved",
    },
    { $set: { referralRewardedAt: new Date() } },
    { new: true }
  );
  if (!claimed) return null;   // a concurrent call already took it

  // The referred worker always gets their days — they did nothing wrong even if
  // their referrer is capped or blocked.
  await Worker.findByIdAndUpdate(referee._id, {
    subscriptionExpiry: computeNewExpiry(referee.subscriptionExpiry, REFERRAL_DAYS),
  });

  let referrerRewarded = false;
  const referrer = await Worker.findById(referee.referredBy).select(
    "status subscriptionExpiry name"
  );
  if (referrer && referrer.status !== "blocked" && referrer.status !== "rejected") {
    // Cap counts OTHER rewarded referrals — this one's flag is already set.
    const alreadyRewarded = await Worker.countDocuments({
      referredBy: referee.referredBy,
      referralRewardedAt: { $ne: null },
      _id: { $ne: referee._id },
    });
    if (alreadyRewarded < REFERRAL_CAP) {
      await Worker.findByIdAndUpdate(referrer._id, {
        subscriptionExpiry: computeNewExpiry(referrer.subscriptionExpiry, REFERRAL_DAYS),
      });
      referrerRewarded = true;
    }
  }

  logger.info("referral payout", {
    referee: String(referee._id),
    referrer: String(referee.referredBy),
    days: REFERRAL_DAYS,
    referrerRewarded,
  });

  return { days: REFERRAL_DAYS, referrerRewarded };
}
