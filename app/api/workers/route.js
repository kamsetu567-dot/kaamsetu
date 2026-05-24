import { connectDB } from "@/lib/db/mongoose";
import Worker from "@/lib/models/Worker";
import { ok, error } from "@/lib/utils/apiResponse";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const category = searchParams.get("category") || "";
    const subcategory = searchParams.get("subcategory") || "";
    const gender = searchParams.get("gender") || "";
    const serviceType = searchParams.get("serviceType") || "";
    const employmentType = searchParams.get("employmentType") || "";
    const experienceLevel = searchParams.get("experienceLevel") || "";
    const sortBy = searchParams.get("sortBy") || "rating";
    const rating = parseFloat(searchParams.get("rating")) || 0;
    const city = searchParams.get("city") || "";

    const filter = { status: "approved" };

    if (category) filter.category = { $regex: category, $options: "i" };
    if (subcategory) filter.subcategory = { $regex: subcategory, $options: "i" };
    if (gender) filter.gender = gender;
    if (serviceType) filter.serviceType = { $in: [serviceType, "both"] };
    if (employmentType) filter.employmentType = { $in: [employmentType, "any"] };
    if (experienceLevel === "fresher") filter.experience = 0;
    if (experienceLevel === "experienced") filter.experience = { $gt: 0 };
    if (rating > 0) filter.rating = { $gte: rating };
    if (city) filter["location.city"] = { $regex: city, $options: "i" };

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { subcategory: { $regex: query, $options: "i" } },
      ];
    }

    const sortMap = {
      rating: { boosted: -1, rating: -1 },
      newest: { createdAt: -1 },
      distance: { rating: -1 },
    };
    const sort = sortMap[sortBy] || sortMap.rating;

    const workers = await Worker.find(filter)
      .sort(sort)
      .limit(50)
      .select("-__v")
      .lean();

    const now = new Date();
    const formatted = workers.map(w => ({
      id: w._id,
      name: w.name,
      photo: w.photo,
      category: w.category,
      subcategory: w.subcategory,
      gender: w.gender,
      experience: w.experience,
      serviceType: w.serviceType,
      status: w.workStatus || "free",
      rating: w.rating,
      location: w.location,
      boosted: w.boosted && w.boostedUntil > now,
      subscriptionActive: w.subscriptionExpiry ? w.subscriptionExpiry > now : false,
      employmentType: w.employmentType || "any",
      skills: w.skills || [],
    }));

    return ok({ workers: formatted });
  } catch (err) {
    console.error("GET /api/workers error:", err);
    return error("Server error", 500);
  }
}
