import { connectDB } from "@/lib/db/mongoose";
import JobRequest from "@/lib/models/JobRequest";
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
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { category: { $regex: search, $options: "i" } },
        { clientMobile: { $regex: search, $options: "i" } },
        { clientName: { $regex: search, $options: "i" } },
      ];
    }

    const jobs = await JobRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const formatted = jobs.map(j => ({
      id: j._id,
      clientName: j.clientName,
      clientMobile: j.clientMobile,
      category: j.category,
      subcategory: j.subcategory,
      location: j.location?.city || j.location?.address || "—",
      status: j.status,
      source: j.source,
      worker: j.worker,
      createdAt: j.createdAt,
    }));

    return ok({ jobs: formatted });
  } catch (err) {
    console.error("admin jobs error:", err);
    return error("Server error", 500);
  }
}
