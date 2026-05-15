import { NextResponse } from "next/server";

// Deprecated — use /api/admin/auth/login instead
export async function POST() {
  return NextResponse.json(
    { success: false, message: "Use /api/admin/auth/login instead" },
    { status: 410 }
  );
}
