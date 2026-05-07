import { NextResponse } from "next/server";

// TODO: Implement proper auth check after switching from localStorage to httpOnly cookies.
// JWT is currently stored in localStorage which is not accessible in middleware/edge runtime.
// Until cookies are used, all route protection is handled client-side.

export function proxy(request) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/worker/dashboard/:path*", "/worker/jobs/:path*", "/worker/profile/:path*"],
};
