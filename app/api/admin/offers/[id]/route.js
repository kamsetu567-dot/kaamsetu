import { connectDB } from "@/lib/db/mongoose";
import Offer from "@/lib/models/Offer";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized, notFound } from "@/lib/utils/apiResponse";

export async function DELETE(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") return unauthorized();
    const { id } = await params;
    await connectDB();
    const offer = await Offer.findByIdAndDelete(id);
    if (!offer) return notFound("Offer not found");
    return ok({ message: "Offer deleted" });
  } catch (err) {
    return error("Server error", 500);
  }
}
