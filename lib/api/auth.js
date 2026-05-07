import { apiPost } from "./client";

export async function verifyOTPWidget(accessToken) {
  const result = await apiPost("/api/auth/verify-otp-widget", { accessToken });
  if (result.token && typeof window !== "undefined") {
    localStorage.setItem("kaamsetu_token", result.token);
    localStorage.setItem("kaamsetu_user", JSON.stringify(result.user));
  }
  return result;
}

export async function signupWorker(data) {
  const result = await apiPost("/api/auth/signup/worker", data);
  if (result.token && typeof window !== "undefined") {
    localStorage.setItem("kaamsetu_token", result.token);
  }
  return result;
}

export async function signupClient(data) {
  const result = await apiPost("/api/auth/signup/client", data);
  if (result.token && typeof window !== "undefined") {
    localStorage.setItem("kaamsetu_token", result.token);
  }
  return result;
}

export async function signupShop(data) {
  return apiPost("/api/auth/signup/shop", data);
}

export async function adminLogin(mobile, password) {
  const result = await apiPost("/api/auth/admin", { mobile, password });
  if (result.token && typeof window !== "undefined") {
    localStorage.setItem("kaamsetu_token", result.token);
    localStorage.setItem("kaamsetu_role", "admin");
  }
  return result;
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("kaamsetu_token");
    localStorage.removeItem("kaamsetu_user");
    localStorage.removeItem("kaamsetu_role");
  }
}
