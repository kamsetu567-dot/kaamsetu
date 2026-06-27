import mongoose from "mongoose";

// Trending keywords managed by the admin Search Management page. Stored as
// one row per keyword so unique enforcement is at the DB level.
const searchKeywordSchema = new mongoose.Schema({
  keyword: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
}, { timestamps: true });

searchKeywordSchema.index({ createdAt: -1 });

export default mongoose.models.SearchKeyword || mongoose.model("SearchKeyword", searchKeywordSchema);
