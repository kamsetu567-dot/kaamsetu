import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    mobile: { type: String, required: true },
    email: { type: String, required: true },
    otp: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ mobile: 1 });

export default mongoose.models.OTP || mongoose.model("OTP", otpSchema);
