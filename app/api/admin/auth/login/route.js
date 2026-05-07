import { signToken } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return error("Username and password required");
    }

    const validUsername = process.env.ADMIN_USERNAME;
    const validPassword = process.env.ADMIN_SECRET_PASSWORD;

    if (username !== validUsername || password !== validPassword) {
      return unauthorized("Invalid username or password");
    }

    const token = signToken({ id: "admin", username, role: "admin" }, "1d");

    return ok({ token, admin: { username, role: "admin" } });
  } catch (err) {
    console.error("Admin login error:", err);
    return error("Server error", 500);
  }
}
