import { connectDB } from "@/lib/db/mongoose";
import Worker from "@/lib/models/Worker";
import Payment from "@/lib/models/Payment";
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
    const page = Math.max(1, parseInt(searchParams.get("page")) || 1);
    // Cap raised to 2000: the admin panel filters/searches client-side over the
    // full set, so it must receive every worker — otherwise pending signups
    // beyond the old 20-row default silently vanished from the approval list.
    const limit = Math.min(2000, Math.max(1, parseInt(searchParams.get("limit")) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }

    const [workers, total] = await Promise.all([
      Worker.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Worker.countDocuments(filter),
    ]);

    // Which of these workers have ever made a real (paid) subscription payment,
    // and WHEN did they last pay? updatedAt is when the Payment flipped to
    // "paid" (verify route sets status:"paid"; timestamps:true on the model).
    const workerIds = workers.map(w => w._id);
    const paidPayments = await Payment.find({
      purpose: "subscription",
      status: "paid",
      worker: { $in: workerIds },
    }).select("worker updatedAt").sort({ updatedAt: -1 }).lean();

    const lastPaidByWorker = new Map(); // workerId → most-recent paid date
    for (const p of paidPayments) {
      const k = String(p.worker);
      if (!lastPaidByWorker.has(k)) lastPaidByWorker.set(k, p.updatedAt); // first seen = newest (sorted desc)
    }
    const paidWorkerIds = new Set(lastPaidByWorker.keys());

    const now = new Date();
    // paymentStatus per worker:
    //   paid    — active subscription AND has a paid payment on record
    //   trial   — active subscription but never paid (legacy trial / admin comp)
    //   expired — had a subscription window that has now passed
    //   none    — never had a subscription (default after approval; must pay)
    function paymentStatus(w) {
      const exp = w.subscriptionExpiry ? new Date(w.subscriptionExpiry) : null;
      const active = exp && exp > now;
      if (active) return paidWorkerIds.has(String(w._id)) ? "paid" : "trial";
      if (exp) return "expired";
      return paidWorkerIds.has(String(w._id)) ? "expired" : "none";
    }

    const formatted = workers.map(w => ({
      id: w._id,
      name: w.name,
      mobile: w.mobile,
      category: w.category,
      subcategory: w.subcategory,
      gender: w.gender,
      serviceType: w.serviceType,
      status: w.status,
      workStatus: w.workStatus,
      rating: w.rating,
      totalRatings: w.totalRatings || 0,
      subscriptionExpiry: w.subscriptionExpiry,
      paymentStatus: paymentStatus(w),
      hasPaid: paidWorkerIds.has(String(w._id)),
      lastPaidAt: lastPaidByWorker.get(String(w._id)) || null,
      createdAt: w.createdAt,
      aadharNumber: w.aadharNumber || null,
      aadharFrontUrl: w.aadharFrontUrl || null,
      aadharBackUrl: w.aadharBackUrl || null,
      photo: w.photo || null,
      city: w.location?.city || null,
    }));

    const pages = Math.ceil(total / limit);
    return ok({
      workers: formatted,
      pagination: { total, page, limit, pages, hasNext: page < pages, hasPrev: page > 1 },
    });
  } catch (err) {
    console.error("admin GET workers error:", err);
    return error("Server error", 500);
  }
}
