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
      locality: String,
      city: String,
      state: String,
      pincode: String,
      coordinates: { type: mongoose.Schema.Types.Mixed }, // set only when GPS available — Mixed prevents partial GeoJSON defaults
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "in_progress", "rejected", "completed", "cancelled"],
      default: "pending",
    },
    source: { type: String, enum: ["search", "category", "direct", "admin"], default: "search" },
    adminNotes: { type: String },
    calledAt: { type: Date },
    resolvedAt: { type: Date },
    dismissedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "Worker" }],
    clientRating: { type: Number, min: 1, max: 5 },
    // 4-digit code the client gives the worker in person to start the job.
    // Set on accept, cleared on completion/cancel. Proof the worker showed up.
    startCode: { type: String },
  },
  { timestamps: true }
);

jobRequestSchema.index({ status: 1 });
jobRequestSchema.index({ worker: 1 });
jobRequestSchema.index({ createdAt: -1 });
jobRequestSchema.index({ "location.coordinates": "2dsphere" });

export default mongoose.models.JobRequest || mongoose.model("JobRequest", jobRequestSchema);
