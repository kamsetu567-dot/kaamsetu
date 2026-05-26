import { connectDB } from "@/lib/db/mongoose";
import Client from "@/lib/models/Client";
import { getTokenFromRequest, verifyToken } from "@/lib/utils/jwt";
import { ok, error, unauthorized, notFound } from "@/lib/utils/apiResponse";

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload) return unauthorized("Invalid or expired token");

    await connectDB();
    const client = await Client.findOne({ user: payload.id }).lean();
    if (!client) return notFound("Client profile not found");

    return ok({ client: { ...client, id: client._id } });
  } catch (err) {
    console.error("GET /api/client/me error:", err);
    return error("Server error", 500);
  }
}

export async function PATCH(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload) return unauthorized("Invalid or expired token");

    await connectDB();
    const body = await request.json();

    const allowed = ["name", "location"];
    const updates = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const client = await Client.findOneAndUpdate(
      { user: payload.id },
      updates,
      { new: true }
    ).lean();
    if (!client) return notFound("Client profile not found");

    return ok({ client: { ...client, id: client._id } });
  } catch (err) {
    console.error("PATCH /api/client/me error:", err);
    return error("Server error", 500);
  }
}
