// All admin-impersonation session juggling lives here. Nothing else should
// open-code these localStorage keys — the swap has several ways to permanently
// lock an admin out of their own panel, and they're only avoidable if there is
// exactly one implementation.
//
// Core invariant: IMPERSONATING ⇔ `kaamsetu_admin_token` IS ABSENT.
// lib/api/client.js prefers the admin token over the user token, so leaving it
// in place would render the user's UI while every API call still executed as
// admin. Removing it makes every caller (including the ~40 that read
// `kaamsetu_token` directly) authenticate as the impersonated user, with no
// change to the shared auth path that normal logins depend on.

const STASH_KEY = "kaamsetu_imp_stash";   // atomic record — see startImpersonation
const FLAG_KEY = "kaamsetu_impersonation"; // display metadata for the banner
const ADMIN_TOKEN = "kaamsetu_admin_token";
const ADMIN_INFO = "kaamsetu_admin";
const USER_TOKEN = "kaamsetu_token";
const USER_INFO = "kaamsetu_user";

function read(key) {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

function readJSON(key) {
  try { return JSON.parse(read(key) || "null"); } catch { return null; }
}

// Decode + expiry-check an ARBITRARY token. adminAuth.isAdminLoggedIn only
// inspects what's in localStorage, so it can't validate a stashed one.
// Signature isn't verified here — the server re-verifies on every call; this
// only stops us restoring a token that's already dead.
export function isTokenAlive(token) {
  if (!token || typeof token !== "string" || token === "null") return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    return typeof payload.exp === "number" && payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

// Returns the banner's view of the world, or null when not impersonating.
// Returning null while an admin token exists self-heals a stale stash: an admin
// who abandons a session, then logs back in, would otherwise get a phantom
// banner over the admin panel whose Exit restores the OLD token and logs them
// straight back out.
export function getImpersonation() {
  if (typeof window === "undefined") return null;
  const flag = readJSON(FLAG_KEY);
  if (!flag) return null;
  if (read(ADMIN_TOKEN)) return null;          // invariant broken → not really impersonating
  if (!readJSON(STASH_KEY)) return null;       // nothing to return to → treat as over
  return { ...flag, sessionLost: !read(USER_TOKEN) };
}

export function isImpersonating() {
  return getImpersonation() !== null;
}

// Swap the browser into the target user's session. Returns false if we refuse.
export function startImpersonation({ token, user, meta }) {
  if (typeof window === "undefined") return false;
  if (!token || !user) return false;

  const adminToken = read(ADMIN_TOKEN);
  // Refuse rather than stash a falsy value: localStorage.setItem coerces, so
  // stashing null would silently store the STRING "null" and restore an
  // unusable token later — an unrecoverable lockout. This also blocks
  // double-impersonation from overwriting a live stash with an already-
  // impersonated one.
  if (!adminToken) return false;
  if (readJSON(STASH_KEY)) return false;

  // Write the stash BEFORE removing anything, and capture the admin's own user
  // session too — an owner testing their own worker account would otherwise
  // have it destroyed by the swap with no way back.
  localStorage.setItem(STASH_KEY, JSON.stringify({
    adminToken,
    admin: read(ADMIN_INFO),
    prevToken: read(USER_TOKEN),
    prevUser: read(USER_INFO),
    startedAt: Date.now(),
  }));

  localStorage.removeItem(ADMIN_TOKEN);   // ← the invariant
  localStorage.setItem(USER_TOKEN, token);
  localStorage.setItem(USER_INFO, JSON.stringify(user));
  localStorage.setItem(FLAG_KEY, JSON.stringify(meta || {}));
  return true;
}

// Restore the admin. Idempotent, and must work even when the impersonated
// session is already gone — the 1h token expiry means lib/api/client.js's 401
// handler WILL eventually clear it out from under us, and Header/dashboard
// Logout buttons are live inside the impersonated account too.
// Returns the path to send the admin to.
export function endImpersonation() {
  if (typeof window === "undefined") return "/admin/login";
  const stash = readJSON(STASH_KEY);

  localStorage.removeItem(FLAG_KEY);
  localStorage.removeItem(STASH_KEY);
  localStorage.removeItem(USER_TOKEN);
  localStorage.removeItem(USER_INFO);

  if (!stash || !isTokenAlive(stash.adminToken)) {
    // Admin's 8h token outlived by the session, or no stash at all — don't
    // restore a corpse, just make them sign in again.
    localStorage.removeItem(ADMIN_TOKEN);
    localStorage.removeItem(ADMIN_INFO);
    return "/admin/login";
  }

  localStorage.setItem(ADMIN_TOKEN, stash.adminToken);
  if (stash.admin) localStorage.setItem(ADMIN_INFO, stash.admin);
  // Put the admin's own user session back exactly as it was.
  if (stash.prevToken) localStorage.setItem(USER_TOKEN, stash.prevToken);
  if (stash.prevUser) localStorage.setItem(USER_INFO, stash.prevUser);

  return "/admin/accounts";
}

// Called on admin login/logout so a stale record can never haunt a fresh session.
export function clearImpersonationState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(FLAG_KEY);
  localStorage.removeItem(STASH_KEY);
}
