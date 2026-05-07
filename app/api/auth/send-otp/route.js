import { error } from "@/lib/utils/apiResponse";

// Deprecated: Use MSG91 OTP Widget + /api/auth/verify-otp-widget instead
export async function POST() {
  return error("This endpoint is deprecated. Use the OTP widget flow.", 410);
}
