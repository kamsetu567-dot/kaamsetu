import { connectDB } from "@/lib/db/mongoose";
import AdminSettings from "@/lib/models/AdminSettings";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";

const DEFAULTS = {
  subscriptionPrice: 199,
  defaultRadius: 5,
  // Manual-QR payment config (used while the Razorpay gateway is hidden).
  paymentMode: "qr",       // "qr" = manual UPI QR flow, "razorpay" = gateway
  paymentQrUrl: "",        // Cloudinary URL of the admin-uploaded UPI QR image
  paymentUpiId: "",        // e.g. karvia@upi — shown alongside the QR
  paymentNote: "",         // instructions shown to the payer
  smsTemplates: {
    jobAlert: "नई job आई है {category} में। Karvia app खोलें।",
    welcome: "Karvia में आपका स्वागत है! आपकी profile अब live है।",
    subscription: "आपकी subscription {days} दिनों के लिए active है।",
  },
};

function adminGuard(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.role === "admin" ? payload : null;
}

export async function GET(request) {
  try {
    if (!adminGuard(request)) return unauthorized();
    await connectDB();
    const doc = await AdminSettings.findOne({ key: "platform_settings" }).lean();
    return ok({ settings: doc?.value ?? DEFAULTS });
  } catch (err) {
    console.error("GET /api/admin/settings error:", err);
    return error("Server error", 500);
  }
}

export async function PUT(request) {
  try {
    if (!adminGuard(request)) return unauthorized();
    const body = await request.json();
    await connectDB();
    // MERGE into the existing blob — the settings UI saves in sections (platform
    // config vs. payment/QR), so a full replace would wipe whatever the current
    // form didn't include (e.g. the QR fields, or smsTemplates).
    const existing = await AdminSettings.findOne({ key: "platform_settings" }).lean();
    const merged = { ...(existing?.value || {}), ...body };
    await AdminSettings.findOneAndUpdate(
      { key: "platform_settings" },
      { $set: { value: merged } },
      { upsert: true, new: true }
    );
    return ok({ message: "Settings saved", settings: merged });
  } catch (err) {
    console.error("PUT /api/admin/settings error:", err);
    return error("Server error", 500);
  }
}
