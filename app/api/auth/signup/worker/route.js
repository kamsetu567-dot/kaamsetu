import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/models/User";
import Worker from "@/lib/models/Worker";
import { signToken, verifyToken } from "@/lib/utils/jwt";
import { ok, error, created } from "@/lib/utils/apiResponse";
import { logger } from "@/lib/utils/logger";

export async function POST(request) {
  try {
    const body = await request.json();

    const { mobile, name, category, subcategory, gender, experience, serviceType, city, area, token, aadharNumber, email, aadharFrontUrl, aadharBackUrl, profilePhotoUrl, workPhotos } = body;
    const location = {
      city: city || "",
      address: area || "",
      ...(body.lat && body.lng ? {
        coordinates: {
          type: "Point",
          coordinates: [parseFloat(body.lng), parseFloat(body.lat)],
        },
      } : {}),
    };

    if (!mobile || !name) {
      return error("mobile and name are required");
    }

    if (!aadharNumber || aadharNumber.length !== 12) {
      return error("Valid 12-digit Aadhar number is required");
    }

    if (!aadharFrontUrl) return error("Aadhar card front photo is required");
    if (!token) return error("OTP verification required before signup");
    const tokenPayload = verifyToken(token);
    if (!tokenPayload) return error("OTP verification required before signup");

    await connectDB();

    const existingWorker = await Worker.findOne({ mobile });
    if (existingWorker) {
      if (existingWorker.status === "approved" || existingWorker.status === "blocked") {
        return error("Mobile number already registered", 400);
      }
      // If pending/rejected, allow re-registration by updating existing record
      await Worker.findByIdAndUpdate(existingWorker._id, {
        name,
        category: category || "",
        subcategory: subcategory || "",
        gender,
        experience: parseInt(experience) || 0,
        serviceType: serviceType || "both",
        location,
        aadharNumber: aadharNumber || "",
        ...(aadharFrontUrl && { aadharFrontUrl }),
        ...(aadharBackUrl && { aadharBackUrl }),
        ...(profilePhotoUrl && { photo: profilePhotoUrl }),
        ...(workPhotos?.length && { workPhotos }),
      });
      const updatedToken = signToken({ id: existingWorker.user, mobile, role: "worker" });
      return ok({
        message: "Registration updated successfully",
        token: updatedToken,
        worker: { id: existingWorker._id, name, status: existingWorker.status },
      });
    }

    const user = await User.create({ mobile, name, email: email || "", role: "worker" });

    let worker;
    try {
      worker = await Worker.create({
        user: user._id,
        mobile,
        name,
        category: category || "",
        subcategory: subcategory || "",
        gender,
        experience: parseInt(experience) || 0,
        serviceType: serviceType || "both",
        location,
        aadharNumber: aadharNumber || "",
        aadharFrontUrl: aadharFrontUrl || "",
        aadharBackUrl: aadharBackUrl || "",
        photo: profilePhotoUrl || "",
        workPhotos: workPhotos || [],
        status: "pending",
      });
    } catch (createError) {
      logger.error("Worker create failed", { msg: createError.message, code: createError.code });
      await User.findByIdAndDelete(user._id);
      return error("Worker registration failed. Please try again.", 500);
    }

    const newToken = signToken({ id: user._id, mobile, role: "worker" });

    return created({
      message: "Worker registered. Pending admin approval.",
      token: newToken,
      worker: { id: worker._id, name, status: "pending" },
    });
  } catch (err) {
    logger.error("[WORKER_SIGNUP] error", { msg: err.message, code: err.code });

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "field";
      return error(`${field} already registered / पहले से registered है`, 409);
    }

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message).join(", ");
      return error(`Validation failed: ${messages}`, 400);
    }

    return error("Server error", 500);
  }
}
