import { v2 as cloudinary } from "cloudinary";
import { verifyToken, getTokenFromRequest } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";
import { logger } from "@/lib/utils/logger";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request) {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      logger.error("Cloudinary env vars not set");
      return error("Upload service not configured. Contact support.", 503);
    }

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

    if (file.size > MAX_FILE_SIZE) {
      return error(`File too large. Maximum ${MAX_FILE_SIZE / (1024 * 1024)}MB allowed.`, 413);
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
    const msg = err?.message || "unknown";
    logger.error("upload error", { err: msg });
    return error(`Upload failed: ${msg}`, 500);
  }
}
