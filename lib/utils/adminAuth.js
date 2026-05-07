export function getAdminToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kaamsetu_admin_token");
}

export function isAdminLoggedIn() {
  return !!getAdminToken();
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
