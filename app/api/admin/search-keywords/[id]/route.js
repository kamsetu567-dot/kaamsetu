import { connectDB } from "@/lib/db/mongoose";
import SearchKeyword from "@/lib/models/SearchKeyword";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";

async function requireAdmin(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") return null;
  return payload;
}

export async function DELETE(request, { params }) {
  try {
    if (!(await requireAdmin(request))) return unauthorized();
    const { id } = await params;
    await connectDB();
    const doc = await SearchKeyword.findByIdAndDelete(id);
    if (!doc) return error("Keyword not found", 404);
    return ok({ deleted: true });
  } catch (err) {
    console.error("DELETE /api/admin/search-keywords/[id] error:", err);
    return error("Server error", 500);
  }
}
