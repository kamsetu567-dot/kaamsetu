import mongoose from "mongoose";

const offerSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discount: { type: String, required: true },
  description: { type: String, default: "" },
  expiresAt: { type: Date, required: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Offer || mongoose.model("Offer", offerSchema);
