import bcrypt from "bcryptjs";

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function comparePassword(plain, hash) {
  if (!hash || !plain) return false;
  return bcrypt.compare(plain, hash);
}

export function validatePasswordStrength(pw) {
  if (!pw || typeof pw !== "string" || pw.length < 6) {
    return "Password must be at least 6 characters / पासवर्ड कम से कम 6 अक्षर का हो";
  }
  if (pw.length > 100) {
    return "Password is too long / पासवर्ड बहुत लंबा है";
  }
  return null;
}
