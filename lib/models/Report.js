import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  // Worker-specific report fields — only set when source === "worker_profile".
  reportedWorkerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker" },
  reportedWorkerName: { type: String },
  // Who filed it — always set.
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reportedByRole: { type: String },
  // Where the report came from. "general" = the navbar Report button.
  source: {
    type: String,
    enum: ["worker_profile", "general"],
    default: "worker_profile",
  },
  // User-supplied summary line — used by general reports.
  title: { type: String, default: "" },
  reason: {
    type: String,
    enum: ["fake_profile", "fraud", "bad_behaviour", "spam", "wrong_work", "general"],
    required: true,
  },
  description: { type: String, default: "" },
  status: {
    type: String,
    enum: ["pending", "reviewed", "action_taken"],
    default: "pending",
  },
  adminNote: { type: String, default: "" },
}, { timestamps: true });

reportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Report || mongoose.model("Report", reportSchema);
