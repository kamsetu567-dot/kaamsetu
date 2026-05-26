import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mobile: { type: String, required: true },
    name: { type: String, trim: true },
    location: {
      address: String,
      city: String,
      state: String,
      pincode: String,
      coordinates: { type: mongoose.Schema.Types.Mixed }, // set only when GPS available
    },
    status: { type: String, enum: ["active", "blocked"], default: "active" },
    totalRequests: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Client || mongoose.model("Client", clientSchema);
