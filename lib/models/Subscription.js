import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    worker: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
    plan: { type: String, enum: ["monthly", "quarterly", "yearly"], default: "monthly" },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    status: { type: String, enum: ["pending", "active", "expired", "failed"], default: "pending" },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

subscriptionSchema.index({ worker: 1, status: 1 });

export default mongoose.models.Subscription || mongoose.model("Subscription", subscriptionSchema);
