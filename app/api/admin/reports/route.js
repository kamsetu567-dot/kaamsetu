import { connectDB } from "@/lib/db/mongoose";
import Report from "@/lib/models/Report";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") return unauthorized();

    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const page = Math.max(1, parseInt(searchParams.get("page")) || 1);
    const limit = Math.min(50, parseInt(searchParams.get("limit")) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (status && status !== "all") filter.status = status;

    const [reports, total] = await Promise.all([
      Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Report.countDocuments(filter),
    ]);

    return ok({
      reports: reports.map(r => ({ ...r, id: r._id })),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("GET /api/admin/reports error:", err);
    return error("Server error", 500);
  }
}
