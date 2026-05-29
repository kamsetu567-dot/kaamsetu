import { connectDB } from "@/lib/db/mongoose";
import AdminSettings from "@/lib/models/AdminSettings";
import { ok, error } from "@/lib/utils/apiResponse";

// Public, unauthenticated — exposes only the safe platform settings that
// the worker/client UI needs (subscription price, default search radius).
// SMS templates and any other admin-only config are NOT returned here.
const DEFAULTS = { subscriptionPrice: 199, defaultRadius: 5 };

export async function GET() {
  try {
    await connectDB();
    const doc = await AdminSettings.findOne({ key: "platform_settings" }).lean();
    const v = doc?.value || {};
    return ok({
      subscriptionPrice: Number(v.subscriptionPrice) || DEFAULTS.subscriptionPrice,
      defaultRadius: Number(v.defaultRadius) || DEFAULTS.defaultRadius,
    });
  } catch (err) {
    console.error("GET /api/settings/public error:", err);
    // Never block the UI on a settings read — fall back to defaults
    return ok(DEFAULTS);
  }
}
