import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/models/User";
import Client from "@/lib/models/Client";
import OTP from "@/lib/models/OTP";
import { signToken, verifyToken } from "@/lib/utils/jwt";
import { ok, error, created } from "@/lib/utils/apiResponse";
import { logger } from "@/lib/utils/logger";
import { hashPassword, validatePasswordStrength } from "@/lib/utils/password";

export async function POST(request) {
  try {
    const body = await request.json();
    const { mobile, name, email, city, area, location, lat, lng, password, otpToken, token: otpProofToken } = body;
    const verifyTokenStr = otpToken || otpProofToken;

    if (!mobile || !name) return error("mobile and name are required");

    const pwError = validatePasswordStrength(password);
    if (pwError) return error(pwError);

    if (!verifyTokenStr) return error("OTP verification required before signup");
    const tokenPayload = verifyToken(verifyTokenStr);
    if (!tokenPayload || !tokenPayload.otpId || tokenPayload.mobile !== mobile) {
      return error("OTP proof invalid or expired. Please verify your OTP again.");
    }

    await connectDB();

    // Atomically burn the OTP proof — second use of the same token gets null
    const claimedOtp = await OTP.findOneAndUpdate(
      { _id: tokenPayload.otpId, mobile, verified: true, consumed: false },
      { $set: { consumed: true } }
    );
    if (!claimedOtp) {
      return error("OTP proof already used or expired. Please verify your OTP again.");
    }

    const passwordHash = await hashPassword(password);

    let user = await User.findOne({ mobile });
    if (user && user.role !== "client") return error("Mobile already registered with a different role");

    let userCreatedHere = false;
    if (!user) {
      user = await User.create({ mobile, name, email: email || "", role: "client", password: passwordHash });
      userCreatedHere = true;
    } else {
      user.name = name;
      if (email) user.email = email;
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
