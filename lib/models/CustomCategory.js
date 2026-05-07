import mongoose from "mongoose";

const customCategorySchema = new mongoose.Schema(
  {
    nameEn: { type: String, required: true, trim: true },
    nameHi: { type: String, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    parentCategory: { type: String },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Worker" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.CustomCategory || mongoose.model("CustomCategory", customCategorySchema);
