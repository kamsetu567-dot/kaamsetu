import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/models/User";
import Client from "@/lib/models/Client";
import { signToken } from "@/lib/utils/jwt";
import { ok, error, created } from "@/lib/utils/apiResponse";
import { logger } from "@/lib/utils/logger";
import { hashPassword, validatePasswordStrength } from "@/lib/utils/password";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const body = await request.json();
    const { mobile, name, email, city, area, location, lat, lng, password } = body;

    if (!mobile || !/^\d{10}$/.test(mobile)) return error("Valid 10-digit mobile number is required");
    if (!name || !name.trim()) return error("Name is required");

    // Email is required but not OTP-verified — it's the only password-recovery path.
    if (!email || !EMAIL_RE.test(email)) return error("Valid email address is required");

    const pwError = validatePasswordStrength(password);
    if (pwError) return error(pwError);

    await connectDB();

    const passwordHash = await hashPassword(password);

    let user = await User.findOne({ mobile }).select("+password");
    let userCreatedHere = false;
    if (user) {
      // Multi-role: same mobile can register as both client and worker.
      // Block only if they're already a client at this number.
      if (user.roles?.includes("client") || user.role === "client") {
        return error("An account already exists with this number. Please login instead.", 409);
      }
      // Add `client` to existing roles, set password (workers don't have one),
      // refresh name/email if they were blank.
      const nextRoles = Array.from(new Set([...(user.roles || []), user.role, "client"].filter(Boolean)));
      user.roles = nextRoles;
      user.name = name;
      user.email = email;
      user.password = passwordHash;
      await user.save();
    } else {
      user = await User.create({ mobile, name, email, roles: ["client"], role: "client", password: passwordHash });
      userCreatedHere = true;
    }

    // Prefer structured `location` from AddressAutocomplete; fall back to legacy flat fields.
    const loc = location || {};
    const latVal = loc.lat ?? lat;
    const lngVal = loc.lng ?? lng;
    const locationData = {
      address: loc.address || area || "",
      locality: loc.locality || "",
      city: loc.city || city || "",
      state: loc.state || "",
      pincode: loc.pincode || "",
    };
    if (latVal && lngVal) {
      locationData.coordinates = { type: "Point", coordinates: [parseFloat(lngVal), parseFloat(latVal)] };
    }

    // Search by mobile to recover orphaned Client docs from previous failed signups
    let client = await Client.findOne({ mobile });
    if (!client) {
      try {
        client = await Client.create({
          user: user._id,
          mobile,
          name,
          location: locationData,
        });
      } catch (clientErr) {
        // Only roll back the User if we created it in this request
        if (userCreatedHere) {
          await User.findByIdAndDelete(user._id);
        }
        logger.error("Client create failed", { err: clientErr.message });
        return error("Registration failed. Please try again.", 500);
      }
    } else {
      // Update existing client (possibly orphaned from a previous attempt)
      client.user = user._id;
      client.name = name;
      client.location = { ...locationData };
      await client.save();
    }

    const authToken = signToken({ id: user._id, mobile, roles: user.roles || ["client"], role: "client" });

    return created({
      message: "Client registered successfully.",
      token: authToken,
      user: { id: user._id, mobile, name, email: email || "", role: "client", roles: user.roles || ["client"] },
    });
  } catch (err) {
    logger.error("client signup error", { err: err.message });
    return error("Server error", 500);
  }
}
