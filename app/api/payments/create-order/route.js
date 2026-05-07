import Razorpay from "razorpay";
import { connectDB } from "@/lib/db/mongoose";
import Subscription from "@/lib/models/Subscription";
import Worker from "@/lib/models/Worker";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";

const PLAN_AMOUNTS = {
  monthly: 19900,    // ₹199
  quarterly: 49900,  // ₹499
  yearly: 149900,    // ₹1499
};

export async function POST(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();

    const payload = verifyToken(token);
    if (!payload || payload.role !== "worker") return unauthorized("Worker access required");

    const { plan = "monthly" } = await request.json();
    const amount = PLAN_AMOUNTS[plan];
    if (!amount) return error("Invalid plan. Choose monthly, quarterly, or yearly.");

    await connectDB();

    const worker = await Worker.findOne({ user: payload.id });
    if (!worker) return error("Worker profile not found");

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || keyId.includes("test_xxxx")) {
      const fakeOrderId = `order_dev_${Date.now()}`;
      const sub = await Subscription.create({
        worker: worker._id,
        plan,
        amount: amount / 100,
        razorpayOrderId: fakeOrderId,
        status: "pending",
      });
      return ok({ orderId: fakeOrderId, amount, currency: "INR", subscriptionId: sub._id, dev: true });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `sub_${worker._id}_${Date.now()}`,
    });

    const sub = await Subscription.create({
      worker: worker._id,
      plan,
      amount: amount / 100,
      razorpayOrderId: order.id,
      status: "pending",
    });

    return ok({ orderId: order.id, amount: order.amount, currency: order.currency, subscriptionId: sub._id });
  } catch (err) {
    console.error("create-order error:", err);
    return error("Server error", 500);
  }
}
