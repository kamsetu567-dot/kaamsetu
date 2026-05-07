import axios from "axios";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/models/User";
import { signToken } from "@/lib/utils/jwt";
import { ok, error } from "@/lib/utils/apiResponse";

export async function POST(request) {
  try {
    const { accessToken, mode = "login" } = await request.json();
    if (!accessToken) return error("Access token is required");

    let mobile;

    try {
      const verifyRes = await axios.post(
        process.env.MSG91_VERIFY_URL,
        {
          authkey: process.env.MSG91_AUTH_KEY,
          "access-token": accessToken,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      const data = verifyRes.data;
      console.log("MSG91 verify response:", JSON.stringify(data));

      if (data.type !== "success") {
        return error("OTP verification failed with provider");
      }

      mobile = data.mobile || data.message?.mobile || data.message;
    } catch (verifyErr) {
      console.error("MSG91 verify error:", verifyErr?.response?.data || verifyErr.message);
      return error("OTP verification failed with provider");
    }

    if (!mobile) return error("Could not retrieve mobile number from OTP verification");

    mobile = mobile.toString().replace(/^(\+91|91)/, "").trim();

    if (!/^\d{10}$/.test(mobile)) {
      return error("Invalid mobile number received from OTP provider");
    }

    await connectDB();

    const user = await User.findOne({ mobile });

    if (!user) {
      if (mode === "signup") {
        // For signup: OTP proved the mobile is real; return a signed token so signup APIs
        // can verify OTP was done. No user is created here — signup endpoints do that.
        const token = signToken({ mobile });
        return ok({ token, mobile, isNewUser: true });
      }
      // For login: reject — user must sign up first
      return error(
        "Account exists नहीं। पहले sign up करें / Account does not exist. Please sign up first",
        404
      );
    }

    if (user.isBlocked) {
      return error("आपका account block है / Your account has been blocked", 403);
    }

    user.isVerified = true;
    await user.save();

    const token = signToken({ id: user._id, mobile: user.mobile, role: user.role });

    return ok({
      token,
      mobile: user.mobile,
      user: {
        id: user._id,
        mobile: user.mobile,
        name: user.name,
        role: user.role,
        status: user.status,
      },
      isNewUser: false,
    });
  } catch (err) {
    console.error("verify-otp-widget error:", err);
    return error("Server error", 500);
  }
}
