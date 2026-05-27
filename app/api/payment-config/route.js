import { connectDB } from "@/lib/db/mongoose";
import AdminSettings from "@/lib/models/AdminSettings";
import { ok, error } from "@/lib/utils/apiResponse";

// Public endpoint — anyone can fetch the platform's UPI receiving details.
// Returns ONLY the safe subset (upiId + qrCodeUrl). Bank account details
// stored in the same AdminSettings doc are NOT exposed here.
//
// Used by the shop ad-payment screen and (later) the worker subscription
// renewal screen so both surfaces share one source of truth.
export async function GET() {
  try {
    await connectDB();
    const doc = await AdminSettings.findOne({ key: "payment_settings" }).lean();
    const v = doc?.value || {};
    return ok({
      upiId: v.upiId || "",
      qrCodeUrl: v.qrCodeUrl || "",
    });
  } catch (err) {
    console.error("GET /api/payment-config error:", err);
    return error("Server error", 500);
  }
}
