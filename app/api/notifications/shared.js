// Shared helpers for the notification routes. Kept in one place so the list
// route and the mark-read route can never disagree about who a notification
// belongs to.

// A user may hold several roles (worker + client). Reading only `payload.role`
// would silently hide one of their streams, so build the audience from the full
// roles array and fall back to the legacy single `role`.
export function audienceForRoles(payload) {
  const roles = Array.isArray(payload?.roles) && payload.roles.length
    ? payload.roles
    : [payload?.role].filter(Boolean);
  return { $in: ["all", ...roles] };
}

// The admin token carries `id: "admin"` — a plain string, not an ObjectId.
// Passing it to User.findById throws a CastError (→ 500), so every User lookup
// on a token id must be guarded with this.
export function isRealUserId(id) {
  return /^[0-9a-fA-F]{24}$/.test(String(id ?? ""));
}
