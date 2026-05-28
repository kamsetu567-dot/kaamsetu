import { connectDB } from "@/lib/db/mongoose";
import Client from "@/lib/models/Client";
import User from "@/lib/models/User";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized, notFound } from "@/lib/utils/apiResponse";

export async function PATCH(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") return unauthorized();

    const { id } = await params;
    const { action } = await request.json();

    await connectDB();

    const client = await Client.findById(id);
    if (!client) return notFound("Client not found");

    if (action === "block") {
      client.status = "blocked";
      await client.save();
      if (client.user) await User.findByIdAndUpdate(client.user, { status: "blocked" });
      return ok({ message: "Client blocked", status: "blocked" });
    }

    if (action === "unblock") {
      client.status = "active";
      await client.save();
      if (client.user) await User.findByIdAndUpdate(client.user, { status: "active" });
      return ok({ message: "Client unblocked", status: "active" });
    }

    if (action === "delete") {
      await Client.findByIdAndDelete(id);
      if (client.user) {
        // Only remove the User if they are actually a client — protect against shared-mobile collisions
        await User.findOneAndDelete({ _id: client.user, role: "client" });
      }
      return ok({ message: "Client deleted" });
    }

    return error("Invalid action");
  } catch (err) {
    console.error("admin PATCH client error:", err);
    return error("Server error", 500);
  }
}
