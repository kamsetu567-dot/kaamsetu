import { connectDB } from "@/lib/db/mongoose";
import AdminSettings from "@/lib/models/AdminSettings";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";

const DEFAULTS = { upiId: "", bankName: "", accountNumber: "", ifsc: "", qrCodeUrl: "" };

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
    const doc = await AdminSettings.findOne({ key: "payment_settings" }).lean();
    return ok({ settings: doc?.value ?? DEFAULTS });
  } catch (err) {
    console.error("GET /api/admin/payment-settings error:", err);
    return error("Server error", 500);
  }
}

export async function PUT(request) {
  try {
    if (!adminGuard(request)) return unauthorized();
    const body = await request.json();
    const { upiId, bankName, accountNumber, ifsc, qrCodeUrl } = body;
    const value = { upiId: upiId || "", bankName: bankName || "", accountNumber: accountNumber || "", ifsc: ifsc || "", qrCodeUrl: qrCodeUrl || "" };
    await connectDB();
    await AdminSettings.findOneAndUpdate(
      { key: "payment_settings" },
      { $set: { value } },
      { upsert: true, new: true }
    );
    return ok({ message: "Payment settings saved", settings: value });
  } catch (err) {
    console.error("PUT /api/admin/payment-settings error:", err);
    return error("Server error", 500);
  }
}
