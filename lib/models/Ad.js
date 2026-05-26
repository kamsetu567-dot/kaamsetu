import mongoose from "mongoose";

const adSchema = new mongoose.Schema(
  {
    shop:        { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    shopUser:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type:        { type: String, enum: ["banner", "featured"], required: true },
    category:    { type: String, required: true },
    duration:    { type: Number, required: true }, // days
    budget:      { type: Number, required: true },
    creative:    { type: String }, // base64 or URL
    status:      { type: String, enum: ["pending", "active", "rejected", "expired"], default: "pending" },
    impressions: { type: Number, default: 0 },
    clicks:      { type: Number, default: 0 },
    startsAt:    { type: Date },
    expiresAt:   { type: Date },
    reviewNote:  { type: String },
  },
  { timestamps: true }
);

adSchema.virtual("ctr").get(function () {
  if (!this.impressions) return "0%";
  return ((this.clicks / this.impressions) * 100).toFixed(1) + "%";
});

adSchema.set("toObject", { virtuals: true });
adSchema.set("toJSON",   { virtuals: true });

export default mongoose.models.Ad || mongoose.model("Ad", adSchema);
