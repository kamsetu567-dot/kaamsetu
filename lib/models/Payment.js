import mongoose from "mongoose";

// One audit trail for every Razorpay payment — worker subscriptions AND shop
// ads. The server records the order at create-order time (status "created")
// with the authoritative amount/purpose, then flips it to "paid" only after a
// valid signature in the verify route. The client never dictates the amount;
// it's read back from this row during verification.
const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    purpose: { type: String, enum: ["subscription", "ad"], required: true },
    amount: { type: Number, required: true }, // rupees (not paise)
    currency: { type: String, default: "INR" },

    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    status: { type: String, enum: ["created", "paid", "failed"], default: "created" },

    // Optional refs depending on purpose.
    worker: { type: mongoose.Schema.Types.ObjectId, ref: "Worker" },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },
    ad: { type: mongoose.Schema.Types.ObjectId, ref: "Ad" },

    // Draft/context payload: { days, plan } for subscriptions;
    // { type, category, duration, creative } for ad drafts (the ad is created
    // in the verify route once payment is confirmed).
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
