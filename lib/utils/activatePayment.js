import Worker from "@/lib/models/Worker";
import Ad from "@/lib/models/Ad";
import { computeNewExpiry } from "@/lib/utils/subscriptionDays";

// Apply the effect of a paid Payment doc: extend the worker's subscription, or
// create the shop's ad. Shared by BOTH the client verify route and the webhook
// so a payment activates exactly once no matter which path confirms it first.
//
// Idempotent: if the payment is already "paid", this is a no-op. The caller is
// responsible for having validated the signature; this only applies effects.
//
// `payment` is a Mongoose doc (mutated + saved here). Returns a small result
// object describing what happened.
export async function activatePayment(payment) {
  if (payment.status === "paid") {
    return { alreadyProcessed: true, purpose: payment.purpose };
  }

  payment.status = "paid";

  if (payment.purpose === "subscription") {
    const days = Number(payment.meta?.days) > 0 ? Math.floor(Number(payment.meta.days)) : 30;
    const worker = await Worker.findById(payment.worker);
    if (!worker) {
      await payment.save();
      return { error: "worker_not_found", purpose: "subscription" };
    }
    // Stacks on an existing future expiry — see computeNewExpiry. Shared with
    // the admin extend action and the referral bonus so all grant paths agree.
    const newExpiry = computeNewExpiry(worker.subscriptionExpiry, days);
    await Worker.findByIdAndUpdate(worker._id, { subscriptionExpiry: newExpiry });
    await payment.save();
    return { purpose: "subscription", expiresAt: newExpiry };
  }

  // purpose === "ad": create the ad now that payment is confirmed. Starts as
  // "pending" so an admin still reviews the creative before it goes live.
  // Guard against a double-create if two paths race: only create if not linked.
  if (!payment.ad) {
    const m = payment.meta || {};
    const ad = await Ad.create({
      shop: payment.shop,
      shopUser: payment.user,
      type: m.type || "banner",
      category: m.category,
      duration: m.duration,
      budget: payment.amount,
      creative: m.creative || null,
      status: "pending",
    });
    payment.ad = ad._id;
    await payment.save();
    return { purpose: "ad", adId: String(ad._id) };
  }

  await payment.save();
  return { purpose: "ad", adId: String(payment.ad) };
}
