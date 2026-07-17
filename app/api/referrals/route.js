import { connectDB } from "@/lib/db/mongoose";
import Worker from "@/lib/models/Worker";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized, forbidden, notFound } from "@/lib/utils/apiResponse";
import { ensureReferralCode, REFERRAL_DAYS, REFERRAL_CAP } from "@/lib/utils/referralPayout";

// The worker's referral hub: their own code (minted on first read), who referred
// them, and everyone they've referred.
export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload) return unauthorized("Invalid or expired token");
    if (payload.role !== "worker") return forbidden("Worker access required");

    await connectDB();
    const worker = await Worker.findOne({ user: payload.id }).select(
      "referralCode referredBy referralRewardedAt"
    );
    if (!worker) return notFound("Worker profile not found");

    // Lazy mint: existing workers predate this field, and the signup route's
    // re-registration branch never reaches Worker.create. Generating on read
    // means every worker gets a code the moment they need one, with no
    // migration and no gaps.
    const code = await ensureReferralCode(worker);

    const referrals = await Worker.find({ referredBy: worker._id })
      .select("name status referralRewardedAt createdAt")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    let referredBy = null;
    if (worker.referredBy) {
      const r = await Worker.findById(worker.referredBy).select("name referralCode").lean();
      if (r) referredBy = { name: r.name || "", code: r.referralCode || "" };
    }

    const rewardedCount = referrals.filter(r => r.referralRewardedAt).length;

    return ok({
      code,
      rewardDays: REFERRAL_DAYS,
      cap: REFERRAL_CAP,
      rewardedCount,
      // Days this worker has actually banked from referring others. Their own
      // joining bonus isn't counted here — this stat is about their sharing.
      daysEarned: Math.min(rewardedCount, REFERRAL_CAP) * REFERRAL_DAYS,
      referredBy,
      // Did THIS worker already redeem someone's code (the input is one-shot)?
      hasRedeemed: !!worker.referredBy,
      referrals: referrals.map(r => ({
        id: String(r._id),
        name: r.name || "—",
        status: r.status,
        rewarded: !!r.referralRewardedAt,
        joinedAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error("GET /api/referrals error:", err);
    return error("Server error", 500);
  }
}
