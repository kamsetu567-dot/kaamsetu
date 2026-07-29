import Worker from "@/lib/models/Worker";
import Shop from "@/lib/models/Shop";
import AdminSettings from "@/lib/models/AdminSettings";

// Single source of truth for what a payment costs and what it's for. Shared by
// the Razorpay create-order route and the manual-QR submit route so the two
// payment paths can NEVER disagree about price, plan length, or ad validation.
// The amount is always computed here from server state — the client's number is
// never trusted.

export const AD_PRICE_PER_DAY = 100;   // ₹/day — mirrors app/shop/ads/page.jsx
export const SUBSCRIPTION_DAYS = 30;
const DEFAULT_SUBSCRIPTION_PRICE = 199;

// Admin-configured monthly subscription price (falls back to the default).
export async function getSubscriptionPrice() {
  const doc = await AdminSettings.findOne({ key: "platform_settings" }).lean();
  const v = Number(doc?.value?.subscriptionPrice);
  return v > 0 ? v : DEFAULT_SUBSCRIPTION_PRICE;
}

// Resolves the payer, validates the request, and prices the order for `purpose`.
// Returns { ok: true, amount, meta, workerRef?, shopRef? } on success, or
// { ok: false, status, message } that the caller maps to an HTTP error.
export async function buildPaymentDraft(purpose, payload, body = {}) {
  if (purpose === "subscription") {
    if (payload.role !== "worker") return { ok: false, status: 403, message: "Worker access required" };
    const worker = await Worker.findOne({ user: payload.id }).lean();
    if (!worker) return { ok: false, status: 404, message: "Worker profile not found" };
    const amount = await getSubscriptionPrice();
    return { ok: true, amount, meta: { days: SUBSCRIPTION_DAYS, plan: "monthly" }, workerRef: worker._id };
  }

  // purpose === "ad"
  if (payload.role !== "shop") return { ok: false, status: 403, message: "Shop access required" };
  const shop = await Shop.findOne({ user: payload.id }).lean();
  if (!shop) return { ok: false, status: 404, message: "Shop profile not found" };
  if (shop.status !== "approved") return { ok: false, status: 403, message: "Shop must be approved before running ads" };

  const duration = Math.floor(Number(body.duration));
  if (!Number.isFinite(duration) || duration < 1 || duration > 90) {
    return { ok: false, status: 400, message: "duration must be between 1 and 90 days" };
  }
  if (!body.type || !body.category) return { ok: false, status: 400, message: "type and category are required" };

  const amount = duration * AD_PRICE_PER_DAY;
  return {
    ok: true,
    amount,
    meta: { type: body.type, category: body.category, duration, creative: body.creative || null },
    shopRef: shop._id,
  };
}
