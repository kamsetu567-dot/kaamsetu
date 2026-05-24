import { ok, error, unauthorized } from "@/lib/utils/apiResponse";
import { getTokenFromRequest, verifyToken } from "@/lib/utils/jwt";

// TODO: Implement PayU payment gateway integration
export async function POST(request) {
  const token = getTokenFromRequest(request);
  if (!token) return unauthorized();

  const payload = verifyToken(token);
  if (!payload || payload.role !== "worker") return unauthorized("Worker access required");

  return error("Payment gateway integration coming soon. Please use manual UPI payment for now.", 501);
}
