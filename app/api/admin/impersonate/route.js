import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/models/User";
import Worker from "@/lib/models/Worker";
import Client from "@/lib/models/Client";
import { signToken, verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized, notFound } from "@/lib/utils/apiResponse";
import { createRateLimit } from "@/lib/middleware/rateLimit";
import { logger } from "@/lib/utils/logger";

// Mints a real user session for an arbitrary account so an admin can see (and
// fix) exactly what that user sees. This is the highest-privilege endpoint in
// the app — treat every change here as a security change.
//
// Deliberate difference from a real login: NO blocked/pending check. Normal
// login 403s those accounts, but they're precisely the ones that need support.

const limiter = createRateLimit(30, 15 * 60 * 1000); // 30 per 15 min per admin

const PROFILE_MODELS = { worker: Worker, client: Client };
const DASHBOARD = { worker: "/worker/dashboard", client: "/client/dashboard" };

export async function POST(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    // Only ever `role`, never `roles` — verifyToken's compat shim fills `role`
    // from `roles[0]` when absent, and a user token could legitimately carry an
    // "admin" entry in `roles`. Checking `role` alone keeps this un-trickable.
    if (!payload || payload.role !== "admin") return unauthorized();

    const { allowed, retryAfter } = await limiter(`impersonate:${payload.username || "admin"}`);
    if (!allowed) return error(`Too many requests. Try again in ${retryAfter}s`, 429);

    const { type, id } = await request.json();
    const Model = PROFILE_MODELS[type];
    if (!Model) return error("type must be 'worker' or 'client'");
    if (!id) return error("id is required");

    await connectDB();

    // Resolve the User server-side from the profile row. The client sends only a
    // Worker/Client id — a client-supplied user id must never be trusted here.
    const profile = await Model.findById(id).lean().catch(() => null);
    if (!profile) return notFound("Account not found");
    if (!profile.user) return notFound("This account has no login attached");

    const user = await User.findById(profile.user).lean();
    if (!user) return notFound("The login for this account no longer exists");

    const roles = user.roles?.length ? user.roles : [user.role].filter(Boolean);
    // Strip "admin": app/api/admin/migrate/role-to-roles accepts
    // `payload.roles.includes("admin")`, so carrying an admin entry through
    // would let an impersonation token run a DB-wide migration. Also guarantee
    // the impersonated role is present — useRoleGuard passes on roles.includes(),
    // and User.role/roles drift on disk (findByIdAndUpdate skips the save hook),
    // which would otherwise make every sub-tab unreachable.
    const effectiveRoles = [...new Set([...roles.filter(r => r !== "admin"), type])];

    // `role: type` is what actually lands the session — the dashboards read the
    // raw `role` field and ignore roles[].
    const sessionToken = signToken(
      { id: user._id, mobile: user.mobile, roles: effectiveRoles, role: type, imp: payload.username || "admin" },
      "1h"
    );

    logger.info("admin impersonation", {
      admin: payload.username || "admin",
      type,
      profileId: String(profile._id),
      userId: String(user._id),
      mobile: user.mobile,
    });

    return ok({
      token: sessionToken,
      user: {
        id: user._id,
        mobile: user.mobile,
        email: user.email || "",
        name: profile.name || user.name || "",
        role: type,
        roles: effectiveRoles,
        activeRole: type,
        status: user.status,
      },
      redirectTo: DASHBOARD[type],
    });
  } catch (err) {
    console.error("POST /api/admin/impersonate error:", err);
    return error("Server error", 500);
  }
}
