import { connectDB } from "@/lib/db/mongoose";
import CustomCategory from "@/lib/models/CustomCategory";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, created, unauthorized } from "@/lib/utils/apiResponse";

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") return unauthorized();

    await connectDB();
    const categories = await CustomCategory.find().sort({ createdAt: -1 }).lean();
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
    if (!nameEn) return error("nameEn is required");

    const slug = nameEn.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    await connectDB();

    const existing = await CustomCategory.findOne({ slug });
    if (existing) return error("Category with this name already exists");

    const category = await CustomCategory.create({
      nameEn,
      nameHi: nameHi || nameEn,
      slug,
      parentCategory,
      requestedBy: payload.role === "worker" ? payload.id : undefined,
      status: payload.role === "admin" ? "approved" : "pending",
    });

    return created({ message: "Category request submitted", category });
  } catch (err) {
    console.error("POST custom categories error:", err);
    return error("Server error", 500);
  }
}
