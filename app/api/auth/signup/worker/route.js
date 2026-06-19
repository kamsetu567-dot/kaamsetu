import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/models/User";
import Worker from "@/lib/models/Worker";
import OTP from "@/lib/models/OTP";
import { signToken, verifyToken } from "@/lib/utils/jwt";
import { ok, error, created } from "@/lib/utils/apiResponse";
import { logger } from "@/lib/utils/logger";

// Allow up to 10 MB body — needed for base64-encoded images sent inline
export const maxDuration = 30;

export async function POST(request) {
  try {
    const body = await request.json();

    const { mobile, name, category, subcategory, gender, experience, serviceType, city, area, token, aadharNumber, email, aadharFrontUrl, aadharBackUrl, profilePhotoUrl, workPhotos } = body;
    // Accept new structured `location` (from AddressAutocomplete) and fall back
    // to legacy flat fields so any in-flight client builds keep working.
    const loc = body.location || {};
    const lat = loc.lat ?? body.lat;
    const lng = loc.lng ?? body.lng;
    const location = {
      address: loc.address || area || "",
      locality: loc.locality || "",
      city: loc.city || city || "",
      state: loc.state || "",
      pincode: loc.pincode || "",
      ...(lat && lng ? {
        coordinates: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
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
    if (!tokenPayload || !tokenPayload.otpId || tokenPayload.mobile !== mobile) {
      return error("OTP proof invalid or expired. Please verify your OTP again.");
    }

    await connectDB();

    // Atomically burn the OTP proof — single-use across all signup endpoints
    const claimedOtp = await OTP.findOneAndUpdate(
      { _id: tokenPayload.otpId, mobile, verified: true, consumed: false },
      { $set: { consumed: true } }
    );
    if (!claimedOtp) {
      return error("OTP proof already used or expired. Please verify your OTP again.");
    }

    const existingWorker = await Worker.findOne({ mobile });
    if (existingWorker) {
      if (existingWorker.status === "approved" || existingWorker.status === "blocked") {
        return error("Mobile number already registered as Worker", 400);
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
      const existingUser = await User.findById(existingWorker.user).lean();
      const updatedToken = signToken({
        id: existingWorker.user,
        mobile,
        roles: existingUser?.roles?.length ? existingUser.roles : ["worker"],
        role: "worker",
      });
      return ok({
        message: "Registration updated successfully",
        token: updatedToken,
        worker: { id: existingWorker._id, name, status: existingWorker.status },
      });
    }

    // Multi-role: if a User with this mobile already exists (e.g. registered
    // as Client), add 'worker' to their roles instead of rejecting. The
    // unique mobile index on User keeps one row per phone number.
    let user = await User.findOne({ mobile });
    let userCreatedHere = false;
    if (user) {
      if (user.roles?.includes("worker") || user.role === "worker") {
        return error("Mobile number already registered as Worker", 409);
      }
      const nextRoles = Array.from(new Set([...(user.roles || []), user.role, "worker"].filter(Boolean)));
      user.roles = nextRoles;
      if (email && !user.email) user.email = email;
      if (name && !user.name) user.name = name;
      await user.save();
    } else {
      user = await User.create({ mobile, name, email: email || "", roles: ["worker"], role: "worker" });
      userCreatedHere = true;
    }

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
      // Only roll back the User if WE just created it. If we added 'worker' to
      // an existing User, deleting it would wipe out their other role too.
      if (userCreatedHere) await User.findByIdAndDelete(user._id);
      return error("Worker registration failed. Please try again.", 500);
    }

    const newToken = signToken({ id: user._id, mobile, roles: user.roles || ["worker"], role: "worker" });

    return created({
      message: "Worker registered. Pending admin approval.",
      token: newToken,
      worker: { id: worker._id, name, status: "pending" },
      user: { id: user._id, mobile, email: email || "", name, role: "worker" },
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
