import mongoose from "mongoose";

const workerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mobile: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    photo: { type: String },
    category: { type: String, required: true },
    subcategory: { type: String },
    gender: { type: String, enum: ["male", "female", "other"] },
    experience: { type: Number, default: 0 },
    serviceType: { type: String, enum: ["home_visit", "shop_office", "both"], default: "both" },
    location: {
      address: String,
      locality: String,
      city: String,
      state: String,
      pincode: String,
      coordinates: { type: mongoose.Schema.Types.Mixed }, // set only when GPS available — Mixed prevents partial GeoJSON defaults
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "blocked", "deactivated"],
      default: "pending",
    },
    workStatus: { type: String, enum: ["free", "working"], default: "free" },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    totalJobs: { type: Number, default: 0 },
    subscriptionExpiry: { type: Date },
    boosted: { type: Boolean, default: false },
    boostedUntil: { type: Date },
    bio: { type: String, maxlength: 500 },
    aadharNumber: { type: String, default: "" },
    aadharFrontUrl: { type: String, default: "" },
    aadharBackUrl: { type: String, default: "" },
    aadharVerified: { type: Boolean, default: false },
    workPhotos: [{ type: String }],
    languages: [{ type: String }],
    skills: [{ type: String }],
    biodata: { type: String, default: "" },
    employmentType: { type: String, enum: ["full_time", "part_time", "any"], default: "any" },
    // ── Referrals ────────────────────────────────────────────────────
    // This worker's own shareable code. Minted lazily on first read of
    // /api/referrals, so existing workers self-heal and the signup route's
    // re-registration branch (which returns before Worker.create) can't miss it.
    // `sparse` is required: workers created before this field exist have no
    // value, and Mongo would otherwise treat every missing one as a duplicate
    // null and refuse to build the unique index.
    referralCode: { type: String, unique: true, sparse: true },
    // Who referred THIS worker. Set once, at redemption.
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "Worker" },
    // When this referral paid out (to both sides). Doubles as the idempotency
    // flag and the audit trail — there's no separate Referral collection.
    referralRewardedAt: { type: Date },
  },
  { timestamps: true }
);

workerSchema.index({ status: 1, workStatus: 1 });
workerSchema.index({ category: 1 });
workerSchema.index({ "location.city": 1 });
workerSchema.index({ "location.coordinates": "2dsphere" });
// Listing a worker's referrals + counting rewarded ones for the cap.
workerSchema.index({ referredBy: 1 });

export default mongoose.models.Worker || mongoose.model("Worker", workerSchema);
