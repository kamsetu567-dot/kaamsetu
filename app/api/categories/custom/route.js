import { connectDB } from "@/lib/db/mongoose";
import CustomCategory from "@/lib/models/CustomCategory";
import { CATEGORIES } from "@/lib/data/categories";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, created, unauthorized } from "@/lib/utils/apiResponse";
import { createRateLimit } from "@/lib/middleware/rateLimit";

const limiter = createRateLimit(5, 60 * 60 * 1000); // 5 per hour per user

export async function GET(request) {
  try {
    // Admin token (or any logged-in user with admin role) sees the full list
    // including pending/rejected. Anyone else gets only approved categories so
    // signup/search/dropdown surfaces can render them without leaking moderation
    // state.
    const token = getTokenFromRequest(request);
    const payload = token ? verifyToken(token) : null;
    const isAdmin = payload?.role === "admin";

    await connectDB();
    const filter = isAdmin ? {} : { status: "approved" };
    const categories = await CustomCategory.find(filter).sort({ createdAt: -1 }).lean();
    return ok({ categories });
  } catch (err) {
    console.error("GET custom categories error:", err);
    return error("Server error", 500);
  }
}

export async function POST(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload) return unauthorized();

    const { nameEn, nameHi, parentCategory } = await request.json();

    const cleanNameEn = typeof nameEn === "string" ? nameEn.trim() : "";
    if (!cleanNameEn) return error("nameEn is required");
    if (cleanNameEn.length < 2 || cleanNameEn.length > 60) {
      return error("Category name must be 2-60 characters");
    }
    const cleanNameHi = typeof nameHi === "string" ? nameHi.trim().slice(0, 60) : "";
    const cleanParent = typeof parentCategory === "string" ? parentCategory.trim().slice(0, 60) : undefined;

    // Per-user rate limit so a logged-in user can't spam categories
    if (payload.role !== "admin") {
      const { allowed, retryAfter } = await limiter(`custom-cat:${payload.id}`);
      if (!allowed) {
        return error(`Too many category requests. Try again in ${retryAfter}s`, 429);
      }
    }

    const slug = cleanNameEn.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!slug) return error("Category name must contain alphanumeric characters");

    // Don't let a custom category shadow a built-in one — it would show up as a
    // confusing duplicate in every dropdown/search. Match on slug or name.
    const nameLc = cleanNameEn.toLowerCase();
    const clashesBuiltin = CATEGORIES.some(
      c => c.slug === slug || c.nameEn.toLowerCase() === nameLc
    );
    if (clashesBuiltin) {
      return error("This category already exists as a built-in category");
    }

    await connectDB();

    const existing = await CustomCategory.findOne({ slug });
    if (existing) return error("Category with this name already exists");

    const category = await CustomCategory.create({
      nameEn: cleanNameEn,
      nameHi: cleanNameHi || cleanNameEn,
      slug,
      parentCategory: cleanParent,
      requestedBy: payload.role === "worker" ? payload.id : undefined,
      status: payload.role === "admin" ? "approved" : "pending",
    });

    return created({ message: "Category request submitted", category });
  } catch (err) {
    // A duplicate-key error (E11000) means the category already exists — surface
    // it as a clean 400 instead of a generic 500. (Also shields against any
    // stale/legacy unique index lingering on the collection.)
    if (err?.code === 11000) {
      return error("Category with this name already exists");
    }
    console.error("POST custom categories error:", err);
    return error("Server error", 500);
  }
}
