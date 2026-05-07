import crypto from "crypto";
import { connectDB } from "@/lib/db/mongoose";
import Subscription from "@/lib/models/Subscription";
import Worker from "@/lib/models/Worker";
import { ok, error } from "@/lib/utils/apiResponse";

const PLAN_DAYS = { monthly: 30, quarterly: 90, yearly: 365 };

export async function POST(request) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, subscriptionId } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return error("Payment data incomplete");
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (secret && !secret.includes("your_")) {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return error("Payment verification failed", 400);
      }
    }

    await connectDB();

    const sub = await Subscription.findById(subscriptionId);
    if (!sub) return error("Subscription record not found");

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (PLAN_DAYS[sub.plan] || 30));

    sub.razorpayPaymentId = razorpay_payment_id;
    sub.razorpaySignature = razorpay_signature;
    sub.status = "active";
    sub.startDate = startDate;
    sub.endDate = endDate;
    await sub.save();

    await Worker.findByIdAndUpdate(sub.worker, { subscriptionExpiry: endDate });

    return ok({ message: "Payment verified. Subscription activated.", expiresAt: endDate });
  } catch (err) {
    console.error("verify payment error:", err);
    return error("Server error", 500);
  }
}
