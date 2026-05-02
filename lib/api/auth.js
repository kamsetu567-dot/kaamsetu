// TODO: Replace with real API calls when backend is ready.

export async function sendOTP(mobile) {
  return { success: true, message: "OTP sent" };
}

export async function verifyOTP(mobile, otp) {
  // Frontend simulation: any 6-digit OTP succeeds
  if (otp && otp.length === 6) {
    return { success: true, token: "simulated-token" };
  }
  return { success: false, message: "Invalid OTP" };
}

export async function loginWithOTP(mobile, otp) {
  const result = await verifyOTP(mobile, otp);
  if (result.success) {
    return { success: true, user: { mobile, role: null, token: result.token } };
  }
  return result;
}

export async function signupWorker(data) {
  return { success: true, message: "Worker registration submitted. Pending admin approval." };
}

export async function signupClient(data) {
  return { success: true, message: "Client registered successfully." };
}

export async function signupShop(data) {
  return { success: true, message: "Shop registration submitted. Pending admin approval." };
}
