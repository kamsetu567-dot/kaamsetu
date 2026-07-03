import { connectDB } from "@/lib/db/mongoose";
import Worker from "@/lib/models/Worker";
import Shop from "@/lib/models/Shop";
import Payment from "@/lib/models/Payment";
import AdminSettings from "@/lib/models/AdminSettings";
import { getTokenFromRequest, verifyToken } from "@/lib/utils/jwt";
import { getRazorpay, isRazorpayConfigured } from "@/lib/utils/razorpay";
import { ok, created, error, unauthorized, forbidden } from "@/lib/utils/apiResponse";

const AD_PRICE_PER_DAY = 100; // ₹/day — mirrors app/shop/ads/page.jsx
const SUBSCRIPTION_DAYS = 30;
const DEFAULT_SUBSCRIPTION_PRICE = 199;

// Read the admin-configured monthly subscription price server-side. Never trust
// a client-sent amount — the order is always priced here.
async function getSubscriptionPrice() {
  const doc = await AdminSettings.findOne({ key: "platform_settings" }).lean();
  const v = Number(doc?.value?.subscriptionPrice);
  return v > 0 ? v : DEFAULT_SUBSCRIPTION_PRICE;
}

export async function POST(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload) return unauthorized();

    if (!isRazorpayConfigured()) {
      return error("Payment gateway not configured. Contact support.", 503);
    }
    const razorpay = getRazorpay();
    if (!razorpay) return error("Payment gateway not configured. Contact support.", 503);

    const body = await request.json().catch(() => ({}));
    const purpose = body.purpose === "ad" ? "ad" : "subscription";

    await connectDB();

    // Build the order server-side per purpose. `amount` is always computed
    // here (rupees); paise = amount * 100 for the Razorpay order.
    let amount, meta, workerRef, shopRef;

    if (purpose === "subscription") {
      if (payload.role !== "worker") return forbidden("Worker access required");
      const worker = await Worker.findOne({ user: payload.id }).lean();
      if (!worker) return error("Worker profile not found", 404);
      amount = await getSubscriptionPrice();
      meta = { days: SUBSCRIPTION_DAYS, plan: "monthly" };
      workerRef = worker._id;
    } else {
      if (payload.role !== "shop") return forbidden("Shop access required");
      const shop = await Shop.findOne({ user: payload.id }).lean();
      if (!shop) return error("Shop profile not found", 404);
      if (shop.status !== "approved") return forbidden("Shop must be approved before running ads");

      const duration = Math.floor(Number(body.duration));
      if (!Number.isFinite(duration) || duration < 1 || duration > 90) {
        return error("duration must be between 1 and 90 days", 400);
      }
      if (!body.type || !body.category) return error("type and category are required", 400);

      amount = duration * AD_PRICE_PER_DAY;
      meta = {
        type: body.type,
        category: body.category,
        duration,
        creative: body.creative || null,
      };
      shopRef = shop._id;
    }

    // Create the Razorpay order (amount in paise).
    let order;
    try {
      order = await razorpay.orders.create({
        amount: amount * 100,
        currency: "INR",
        receipt: `${purpose}_${payload.id}_${Date.now()}`,
        notes: { purpose, userId: String(payload.id) },
      });
    } catch (rzErr) {
      console.error("razorpay order create failed:", rzErr?.message || rzErr);
      return error("Could not start payment. Please try again.", 502);
    }

    const paymentDoc = await Payment.create({
      user: payload.id,
      purpose,
      amount,
      currency: "INR",
      razorpayOrderId: order.id,
      status: "created",
      worker: workerRef,
      shop: shopRef,
      meta,
    });

    return created({
      orderId: order.id,
      amount,               // rupees, for display
      amountPaise: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      paymentDbId: String(paymentDoc._id),
      purpose,
    });
  } catch (err) {
    console.error("POST /api/payments/create-order error:", err);
    return error("Server error", 500);
  }
}
