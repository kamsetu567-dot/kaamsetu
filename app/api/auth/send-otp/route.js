import { ok, error } from "@/lib/utils/apiResponse";

// TODO: Before going live, integrate real MSG91 SendOTP API here
export async function POST(request) {
  try {
    const { mobile } = await request.json();

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return error("Valid 10-digit mobile number is required");
    }

    // TODO: Before going live, integrate real MSG91 SendOTP API here
    console.log(`TEST OTP: 123456 for mobile ${mobile}`);

    return ok({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("send-otp error:", err);
    return error("Server error", 500);
  }
}
