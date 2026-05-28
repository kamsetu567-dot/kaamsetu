// Client-side image processor for any format a phone might hand us.
//
// Goal: the user never has to know about formats. They pick any photo;
// we make it work. Flow:
//   1. If it looks like HEIC/HEIF (iPhone/Android camera), convert to JPEG
//      first via heic2any (lazy-loaded only when needed).
//   2. Compress/resize via canvas to a small JPEG base64.
//   3. If compression fails or times out, fall back to uploading the
//      ORIGINAL file as base64 — but only if it's within size budget.
//      If the original is too big, throw IMAGE_TOO_BIG (the only error a
//      user should ever see).
//
// The backend accepts base64 inline with a ~10MB body cap; base64 inflates
// ~33%, and aadhar photos share the same request, so cap the raw fallback
// at ~3.5MB.
const MAX_ORIGINAL_BYTES = 3.5 * 1024 * 1024;

function isHeic(file) {
  const t = (file.type || "").toLowerCase();
  const n = (file.name || "").toLowerCase();
  return t.includes("heic") || t.includes("heif") || n.endsWith(".heic") || n.endsWith(".heif");
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("IMAGE_DECODE_FAILED"));
    reader.readAsDataURL(file);
  });
}

// Canvas compress a blob/file that the browser CAN decode. Resolves base64,
// rejects on error/timeout so the caller can fall back.
function canvasCompress(blob, { maxPx, quality, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new window.Image();
    let settled = false;
    const cleanup = () => { clearTimeout(timer); URL.revokeObjectURL(url); };
    const fail = (err) => { if (!settled) { settled = true; cleanup(); reject(err); } };
    const done = (v) => { if (!settled) { settled = true; cleanup(); resolve(v); } };
    const timer = setTimeout(() => fail(new Error("IMAGE_TIMEOUT")), timeoutMs);

    img.onerror = () => fail(new Error("IMAGE_DECODE_FAILED"));
    img.onload = () => {
      try {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return fail(new Error("IMAGE_DECODE_FAILED"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        done(canvas.toDataURL("image/jpeg", quality));
      } catch {
        fail(new Error("IMAGE_DECODE_FAILED"));
      }
    };
    img.src = url;
  });
}

export async function compressImage(file, { maxPx = 1000, quality = 0.7, timeoutMs = 15000 } = {}) {
  let source = file;

  // Step 1 — HEIC/HEIF → JPEG before anything touches a canvas.
  if (isHeic(file)) {
    try {
      const heic2any = (await import("heic2any")).default;
      const converted = await heic2any({ blob: file, toType: "image/jpeg", quality });
      source = Array.isArray(converted) ? converted[0] : converted;
    } catch {
      // Conversion failed — fall through to the original-file fallback below.
      source = file;
    }
  }

  // Step 2 — try canvas compression (small output, the happy path).
  try {
    return await canvasCompress(source, { maxPx, quality, timeoutMs });
  } catch {
    // Step 3 — fallback: upload the ORIGINAL file untouched, if it fits.
    if (file.size > MAX_ORIGINAL_BYTES) {
      throw new Error("IMAGE_TOO_BIG");
    }
    return await readAsDataURL(file);
  }
}
