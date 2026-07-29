import mongoose from "mongoose";

// One audit trail for every payment — worker subscriptions AND shop ads, via
// either Razorpay OR the manual UPI-QR flow.
//
// Razorpay: the server records the order at create-order time (status "created")
// with the authoritative amount/purpose, then flips it to "paid" only after a
// valid signature in the verify route.
//
// Manual QR (`method: "manual_qr"`): used while the Razorpay gateway is hidden.
// The payer scans an admin-uploaded QR, pays over UPI, and uploads a screenshot;
// the row is created as "pending_review" and an admin approves it (→ "paid",
// runs the same activatePayment) or rejects it (→ "rejected").
//
// The client never dictates the amount either way — it's always priced server-side.
const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    purpose: { type: String, enum: ["subscription", "ad"], required: true },
    amount: { type: Number, required: true }, // rupees (not paise)
    currency: { type: String, default: "INR" },

    // How the payment was made. "razorpay" is the historical default so existing
    // rows keep their meaning; "manual_qr" is the admin-approved UPI flow.
    method: { type: String, enum: ["razorpay", "manual_qr"], default: "razorpay" },

    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    status: {
      type: String,
      enum: ["created", "pending_review", "paid", "failed", "rejected"],
      default: "created",
    },

    // Manual-QR flow: the UPI payment screenshot the payer uploaded as proof,
    // plus who reviewed it and why (on rejection).
    screenshotUrl: { type: String },
    reviewedBy: { type: String },        // admin username/id who approved/rejected
    reviewedAt: { type: Date },
    rejectReason: { type: String },

    // Optional refs depending on purpose.
    worker: { type: mongoose.Schema.Types.ObjectId, ref: "Worker" },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },
    ad: { type: mongoose.Schema.Types.ObjectId, ref: "Ad" },

    // Draft/context payload: { days, plan } for subscriptions;
    // { type, category, duration, creative } for ad drafts (the ad is created
    // on activation once payment is confirmed/approved).
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
