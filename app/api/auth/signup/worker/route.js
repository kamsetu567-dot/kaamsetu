import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/models/User";
import Worker from "@/lib/models/Worker";
import { signToken, verifyToken } from "@/lib/utils/jwt";
import { ok, error, created } from "@/lib/utils/apiResponse";

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("Worker signup called with body:", JSON.stringify(body));

    const { mobile, name, category, subcategory, gender, experience, serviceType, city, area, token } = body;
    const location = { city: city || "", address: area || "" };

    if (!mobile || !name) {
      return error("mobile and name are required");
    }

    if (!token) return error("OTP verification required before signup");
    const tokenPayload = verifyToken(token);
    if (!tokenPayload) return error("OTP verification required before signup");

    await connectDB();

    const existingWorker = await Worker.findOne({ mobile });
    if (existingWorker) {
      if (existingWorker.status === "approved" || existingWorker.status === "blocked") {
        return error("Mobile number already registered", 400);
      }
      // If pending, allow re-registration by updating existing record
      await Worker.findByIdAndUpdate(existingWorker._id, {
        name,
        category: category || "",
        subcategory: subcategory || "",
        gender,
        experience: parseInt(experience) || 0,
        serviceType: serviceType || "both",
        location,
        updatedAt: new Date(),
      });
      const updatedToken = signToken({ id: existingWorker.user, mobile, role: "worker" });
      return ok({
        message: "Registration updated successfully",
        token: updatedToken,
        worker: { id: existingWorker._id, name, status: existingWorker.status },
      });
    }

    const user = await User.create({ mobile, name, role: "worker" });

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
        status: "pending",
      });
      console.log("Worker created successfully:", worker._id);
    } catch (createError) {
      console.error("Worker create failed:", createError.message);
      await User.findByIdAndDelete(user._id);
      return error(`Worker creation failed: ${createError.message}`, 500);
    }

    const newToken = signToken({ id: user._id, mobile, role: "worker" });

    return created({
      message: "Worker registered. Pending admin approval.",
      token: newToken,
      worker: { id: worker._id, name, status: "pending" },
    });
  } catch (err) {
    console.error("worker signup error:", err);
    return error("Server error", 500);
  }
}
