import { signToken } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";

export async function POST(request) {
  try {
    const { mobile, password } = await request.json();

    const adminMobile = process.env.ADMIN_MOBILE;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (mobile !== adminMobile || password !== adminPassword) {
      return unauthorized("Invalid admin credentials");
    }

    const token = signToken({ id: "admin", mobile, role: "admin" }, "1d");

    return ok({ token, role: "admin" });
  } catch (err) {
    console.error("admin login error:", err);
    return error("Server error", 500);
  }
}
