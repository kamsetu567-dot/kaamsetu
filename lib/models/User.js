import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    mobile: { type: String, required: true, unique: true, trim: true },
    name: { type: String, trim: true },
    role: { type: String, enum: ["worker", "client", "admin", "shop"], required: true },
    status: { type: String, enum: ["active", "blocked"], default: "active" },
    profileComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
