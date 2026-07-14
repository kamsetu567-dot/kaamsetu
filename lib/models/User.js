import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    mobile: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    name: { type: String, trim: true },
    // Multi-role: one User can hold multiple roles (e.g. someone who hires
    // workers AND offers services). `role` is kept as a legacy mirror of the
    // first entry for backward compat with code still reading user.role.
    roles: {
      type: [String],
      enum: ["worker", "client", "admin", "shop"],
      default: [],
    },
    role: { type: String, enum: ["worker", "client", "admin", "shop"] },
    status: { type: String, enum: ["active", "blocked"], default: "active" },
    profileComplete: { type: Boolean, default: false },
    // Bcrypt hash — only set for clients using password auth. select:false so it
    // never leaks via the many User.find().lean() calls; read it explicitly with
    // .select("+password") in the login route.
    password: { type: String, select: false },
    // High-water mark for the navbar notification bell. Notifications created
    // after this instant are "unread". null → the user has never opened the
    // bell, so everything is unread. Per-user read state can't live on the
    // Notification doc itself — one broadcast doc serves many users.
    notificationsSeenAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Keep `role` mirror in sync with `roles[0]`. If a legacy caller only sets
// `role`, propagate it to `roles`. If a new caller only sets `roles`, copy the
// first entry to `role`. Either way both fields stay coherent on disk.
//
// Mongoose 9 dropped the `next` callback parameter for pre/post hooks — the
// hook is now an async-or-promise-returning function. Calling next() here
// throws "next is not a function" and breaks every signup that hits the User
// model. Just mutate `this` and let the hook resolve.
userSchema.pre("save", function () {
  if (this.roles?.length && !this.role) this.role = this.roles[0];
  else if (this.role && !this.roles?.length) this.roles = [this.role];
});

export default mongoose.models.User || mongoose.model("User", userSchema);
