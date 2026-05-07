import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "kaamsetu_default_secret";

export function signToken(payload, expiresIn = "7d") {
  return jwt.sign(payload, SECRET, { expiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookie = request.cookies?.get?.("token")?.value;
  return cookie || null;
}
