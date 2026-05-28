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

    let user = await User.findOne({ mobile });
    if (user && user.role !== "client") return error("Mobile already registered with a different role");
    // Block re-registering an existing client — they should log in instead.
    if (user && user.role === "client") {
      return error("An account already exists with this number. Please login instead.", 409);
    }

    let userCreatedHere = false;
    if (!user) {
      user = await User.create({ mobile, name, email, role: "client", password: passwordHash });
      userCreatedHere = true;
    } else {
      user.name = name;
      user.email = email;
      user.password = passwordHash;
      await user.save();
    }

    const locationData = {
      city: city || "",
      address: area || "",
    };
    if (lat && lng) {
      locationData.coordinates = { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] };
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

    const authToken = signToken({ id: user._id, mobile, role: "client" });

    return created({
      message: "Client registered successfully.",
      token: authToken,
      user: { id: user._id, mobile, name, email: email || "", role: "client" },
    });
  } catch (err) {
    logger.error("client signup error", { err: err.message });
    return error("Server error", 500);
  }
}
