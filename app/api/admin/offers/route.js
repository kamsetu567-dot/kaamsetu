import { connectDB } from "@/lib/db/mongoose";
import Offer from "@/lib/models/Offer";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, created, error, unauthorized } from "@/lib/utils/apiResponse";

function adminGuard(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.role === "admin" ? payload : null;
}

export async function GET(request) {
  try {
    if (!adminGuard(request)) return unauthorized();
    await connectDB();
    const offers = await Offer.find().sort({ createdAt: -1 }).lean();
    return ok({ offers: offers.map(o => ({ ...o, id: o._id })) });
  } catch (err) {
    return error("Server error", 500);
  }
}

export async function POST(request) {
  try {
    if (!adminGuard(request)) return unauthorized();
    const body = await request.json();
    const { title, code, discount, description, expiresAt } = body;
    if (!title || !code || !discount || !expiresAt) return error("title, code, discount, expiresAt are required");
    await connectDB();
    const offer = await Offer.create({ title, code: code.toUpperCase(), discount, description: description || "", expiresAt: new Date(expiresAt) });
    return created({ offer: { ...offer.toObject(), id: offer._id } });
  } catch (err) {
    if (err.code === 11000) return error("Offer code already exists", 409);
    return error("Server error", 500);
  }
}
