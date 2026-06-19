import jwt from "jsonwebtoken";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set. Set it in your .env file.");
  }
  return secret;
}

export function signToken(payload, expiresIn = "24h") {
  return jwt.sign(payload, getSecret(), { expiresIn });
}

export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, getSecret());
    // Backward-compat shim: legacy tokens carry `role` (string), new tokens
    // carry `roles` (array). Always synthesize the missing one so route
    // handlers can check either form and not break across the migration.
    if (payload && !payload.roles && payload.role) payload.roles = [payload.role];
    if (payload && payload.roles?.length && !payload.role) payload.role = payload.roles[0];
    return payload;
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
