import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mobile: { type: String, required: true },
    ownerName: { type: String, required: true, trim: true },
    shopName: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    description: { type: String, maxlength: 1000 },
    photo: { type: String },
    location: {
      address: String,
      city: String,
      state: String,
      pincode: String,
      coordinates: { lat: Number, lng: Number },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "blocked"],
      default: "pending",
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    openingHours: { type: String },
    adActive: { type: Boolean, default: false },
    adExpiry: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Shop || mongoose.model("Shop", shopSchema);
