import { connectDB } from "@/lib/db/mongoose";
import AdminSettings from "@/lib/models/AdminSettings";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";

const KEY = "security_settings";
const DEFAULTS = { adminOtp: true, idVerify: false, fraudList: [] };

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
    const doc = await AdminSettings.findOne({ key: KEY }).lean();
    const value = doc?.value || {};
    return ok({
      settings: {
        adminOtp: typeof value.adminOtp === "boolean" ? value.adminOtp : DEFAULTS.adminOtp,
        idVerify: typeof value.idVerify === "boolean" ? value.idVerify : DEFAULTS.idVerify,
        fraudList: Array.isArray(value.fraudList) ? value.fraudList : DEFAULTS.fraudList,
      },
    });
  } catch (err) {
    console.error("GET /api/admin/security-settings error:", err);
    return error("Server error", 500);
  }
}

export async function PATCH(request) {
  try {
    if (!(await requireAdmin(request))) return unauthorized();
    const body = await request.json();
    // Whitelist what the client can write.
    const next = {};
    if (typeof body.adminOtp === "boolean") next.adminOtp = body.adminOtp;
    if (typeof body.idVerify === "boolean") next.idVerify = body.idVerify;
    if (Array.isArray(body.fraudList)) {
      next.fraudList = body.fraudList
        .map(s => String(s || "").trim())
        .filter(Boolean)
        .slice(0, 200); // sanity cap
    }

    await connectDB();
    const doc = await AdminSettings.findOneAndUpdate(
      { key: KEY },
      { $set: { value: { ...DEFAULTS, ...((await AdminSettings.findOne({ key: KEY }))?.value || {}), ...next } } },
      { upsert: true, new: true }
    ).lean();
    return ok({ settings: doc.value });
  } catch (err) {
    console.error("PATCH /api/admin/security-settings error:", err);
    return error("Server error", 500);
  }
}
