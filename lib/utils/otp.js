// NOTE: Direct OTP send/verify is no longer used.
// We now use MSG91 OTP Widget for all OTP flows.
// This file is kept for reference only.
import axios from "axios";

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTPviaMSG91(mobile, otp) {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  const senderId = process.env.MSG91_SENDER_ID || "KARVIA";

  if (!authKey || authKey === "your_msg91_auth_key_here") {
    console.log(`[DEV] OTP for ${mobile}: ${otp}`);
    return { success: true, dev: true };
  }

  try {
    const res = await axios.post(
      "https://api.msg91.com/api/v5/otp",
      {
        template_id: templateId,
        mobile: `91${mobile}`,
        authkey: authKey,
        otp,
        sender: senderId,
      },
      { headers: { "Content-Type": "application/json" } }
    );
    return { success: true, data: res.data };
  } catch (err) {
    console.error("MSG91 error:", err?.response?.data || err.message);
    return { success: false, error: err.message };
  }
}
