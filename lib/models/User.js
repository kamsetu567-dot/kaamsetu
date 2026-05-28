import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    mobile: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    name: { type: String, trim: true },
    role: { type: String, enum: ["worker", "client", "admin", "shop"], required: true },
    status: { type: String, enum: ["active", "blocked"], default: "active" },
    profileComplete: { type: Boolean, default: false },
    // Bcrypt hash — only set for clients using password auth. select:false so it
    // never leaks via the many User.find().lean() calls; read it explicitly with
    // .select("+password") in the login route.
    password: { type: String, select: false },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
