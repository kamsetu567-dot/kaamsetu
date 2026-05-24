import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  reportedWorkerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker" },
  reportedWorkerName: { type: String },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reportedByRole: { type: String },
  reason: {
    type: String,
    enum: ["fake_profile", "fraud", "bad_behaviour", "spam", "wrong_work"],
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
