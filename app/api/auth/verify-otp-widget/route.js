import { NextResponse } from "next/server";

// This route is no longer used — OTP widget replaced with simple test OTP system
export async function POST() {
  return NextResponse.json(
    { success: false, message: "Use /api/auth/verify-otp instead" },
    { status: 410 }
  );
}
