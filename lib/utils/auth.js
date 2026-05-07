import { verifyToken, getTokenFromRequest } from "./jwt";
import { unauthorized } from "./apiResponse";

export function withAuth(handler, allowedRoles = []) {
  return async function (request, context) {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();

    const payload = verifyToken(token);
    if (!payload) return unauthorized("Invalid or expired token");

    if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
      return unauthorized("Access denied");
    }

    request.user = payload;
    return handler(request, context);
  };
}

export function withAdmin(handler) {
  return withAuth(handler, ["admin"]);
}

export function withWorker(handler) {
  return withAuth(handler, ["worker", "admin"]);
}

export function withClient(handler) {
  return withAuth(handler, ["client", "worker", "admin"]);
}
