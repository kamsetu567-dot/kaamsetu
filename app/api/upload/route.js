import { v2 as cloudinary } from "cloudinary";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload) return unauthorized();

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder") || "kaamsetu";

    if (!file || typeof file === "string") {
      return error("No file provided");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder, resource_type: "image", quality: "auto", fetch_format: "auto" },
        (err, result) => { if (err) reject(err); else resolve(result); }
      ).end(buffer);
    });

    return ok({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    console.error("upload error:", err);
    return error("Upload failed. Please try again.", 500);
  }
}
