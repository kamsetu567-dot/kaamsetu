import mongoose from "mongoose";

// System-wide notifications shown in the user navbar bell. Admin inserts
// rows directly into this collection for now (admin-write UI is a follow-up).
const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  body:  { type: String, default: "" },
  // Optional deep-link rendered as a "View" link in the dropdown.
  href:  { type: String, default: "" },
  // "all" → visible to every signed-in user; or a single role tag.
  audience: {
    type: String,
    enum: ["all", "worker", "client", "shop", "admin"],
    default: "all",
  },
  // Soft-delete switch; admin can toggle without losing history.
  active: { type: Boolean, default: true },
}, { timestamps: true });

notificationSchema.index({ active: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
