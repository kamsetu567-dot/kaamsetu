import { connectDB } from "@/lib/db/mongoose";
import SearchKeyword from "@/lib/models/SearchKeyword";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, created, error, unauthorized } from "@/lib/utils/apiResponse";

async function requireAdmin(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") return null;
  return payload;
}

export async function GET(request) {
  try {
    if (!(await requireAdmin(request))) return unauthorized();
    await connectDB();
    const docs = await SearchKeyword.find({}).sort({ createdAt: -1 }).lean();
    return ok({
      keywords: docs.map(d => ({ id: String(d._id), keyword: d.keyword })),
    });
  } catch (err) {
    console.error("GET /api/admin/search-keywords error:", err);
    return error("Server error", 500);
  }
}

export async function POST(request) {
  try {
    const payload = await requireAdmin(request);
    if (!payload) return unauthorized();
    const body = await request.json();
    const keyword = String(body.keyword || "").trim().toLowerCase();
    if (!keyword) return error("Keyword is required");
    if (keyword.length > 80) return error("Keyword too long");

    await connectDB();
    try {
      const doc = await SearchKeyword.create({ keyword });
      return created({ keyword: { id: String(doc._id), keyword: doc.keyword } });
    } catch (e) {
      if (e.code === 11000) return error("Keyword already exists", 409);
      throw e;
    }
  } catch (err) {
    console.error("POST /api/admin/search-keywords error:", err);
    return error("Server error", 500);
  }
}
