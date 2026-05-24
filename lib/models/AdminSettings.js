import mongoose from "mongoose";

const adminSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

export default mongoose.models.AdminSettings || mongoose.model("AdminSettings", adminSettingsSchema);
