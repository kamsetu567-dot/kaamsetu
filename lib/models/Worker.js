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
      city: String,
      state: String,
      pincode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
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
    languages: [{ type: String }],
  },
  { timestamps: true }
);

workerSchema.index({ status: 1, workStatus: 1 });
workerSchema.index({ category: 1 });
workerSchema.index({ "location.city": 1 });

export default mongoose.models.Worker || mongoose.model("Worker", workerSchema);
