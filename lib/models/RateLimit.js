import mongoose from "mongoose";

const rateLimitSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// TTL: rows self-delete once expiresAt passes
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Compound index for the hot path: countDocuments({ key, expiresAt: { $gt: now } })
rateLimitSchema.index({ key: 1, expiresAt: 1 });

export default mongoose.models.RateLimit || mongoose.model("RateLimit", rateLimitSchema);
