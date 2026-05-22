import mongoose from "mongoose";

const jobRequestSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
    clientMobile: { type: String, required: true },
    clientName: { type: String },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: "Worker" },
    category: { type: String, required: true },
    subcategory: { type: String },
    description: { type: String },
    location: {
      address: String,
      city: String,
      pincode: String,
      coordinates: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], default: undefined }, // [lng, lat]
      },
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
      default: "pending",
    },
    source: { type: String, enum: ["search", "category", "direct", "admin"], default: "search" },
    adminNotes: { type: String },
    calledAt: { type: Date },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

jobRequestSchema.index({ status: 1 });
jobRequestSchema.index({ worker: 1 });
jobRequestSchema.index({ createdAt: -1 });
jobRequestSchema.index({ "location.coordinates": "2dsphere" });

export default mongoose.models.JobRequest || mongoose.model("JobRequest", jobRequestSchema);
