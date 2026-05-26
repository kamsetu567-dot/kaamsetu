export function getAdminToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kaamsetu_admin_token");
}

export function isAdminLoggedIn() {
  const token = getAdminToken();
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    // JWT uses base64url — replace url-safe chars before decoding
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    return typeof payload.exp === "number" && payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export function adminLogout() {
  localStorage.removeItem("kaamsetu_admin_token");
  localStorage.removeItem("kaamsetu_admin");
  window.location.href = "/admin/login";
}

export function getAdminAuthHeaders() {
  const token = getAdminToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
