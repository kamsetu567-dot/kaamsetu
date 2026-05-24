import { connectDB } from "@/lib/db/mongoose";
import CustomCategory from "@/lib/models/CustomCategory";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized, notFound } from "@/lib/utils/apiResponse";

export async function PATCH(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") return unauthorized();

    const { id } = await params;
    const { status } = await request.json();
    await connectDB();

    if (status === "deleted") {
      const cat = await CustomCategory.findByIdAndDelete(id);
      if (!cat) return notFound("Category not found");
      return ok({ message: "Category deleted" });
    }

    const cat = await CustomCategory.findByIdAndUpdate(id, { status }, { new: true });
    if (!cat) return notFound("Category not found");
    return ok({ message: "Category updated", category: cat });
  } catch (err) {
    console.error("PATCH /api/categories/custom/[id] error:", err);
    return error("Server error", 500);
  }
}
