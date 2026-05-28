// Client-side image processor for any format a phone might hand us.
//
// The user should never think about formats. They pick any photo; we make
// it work. Flow:
//   1. HEIC/HEIF (iPhone/Android camera) -> JPEG via heic2any (lazy-loaded
//      only when an HEIC is actually detected).
//   2. Canvas compress/resize to a small JPEG base64 (happy path).
//   3. If compression fails or times out, fall back to reading the ORIGINAL
//      file as base64 — reading raw bytes never "fails to decode", so this
//      almost always succeeds. The only guard is size: if the original is
//      too big to fit the request body, throw IMAGE_TOO_BIG.
//
// IMAGE_TOO_BIG is the ONLY error this module ever throws. Callers map it to
// a friendly "image too big" message; everything else just works.
//
// Backend accepts base64 inline with a ~10MB body cap; base64 inflates ~33%
// and aadhar photos share the request, so cap the raw fallback at ~3.5MB.
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
    // A read error here is genuinely unrecoverable, but it's byte-level —
    // it does NOT depend on image format. Treat it as too-big/unreadable.
    reader.onerror = () => reject(new Error("IMAGE_TOO_BIG"));
    reader.readAsDataURL(file);
  });
}

// Canvas compress a blob/file the browser can decode. Rejects on
// error/timeout so the caller falls back to the raw original.
function canvasCompress(blob, { maxPx, quality, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new window.Image();
    let settled = false;
    const cleanup = () => { clearTimeout(timer); URL.revokeObjectURL(url); };
    const fail = (err) => { if (!settled) { settled = true; cleanup(); reject(err); } };
    const done = (v) => { if (!settled) { settled = true; cleanup(); resolve(v); } };
    const timer = setTimeout(() => fail(new Error("COMPRESS_TIMEOUT")), timeoutMs);

    img.onerror = () => fail(new Error("COMPRESS_FAILED"));
    img.onload = () => {
      try {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return fail(new Error("COMPRESS_FAILED"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        done(canvas.toDataURL("image/jpeg", quality));
      } catch {
        fail(new Error("COMPRESS_FAILED"));
      }
    };
    img.src = url;
  });
}

export async function compressImage(file, { maxPx = 1000, quality = 0.7, timeoutMs = 12000 } = {}) {
  let source = file;

  // Step 1 — HEIC/HEIF -> JPEG before any canvas work.
  if (isHeic(file)) {
    try {
      const heic2any = (await import("heic2any")).default;
      const converted = await heic2any({ blob: file, toType: "image/jpeg", quality });
      source = Array.isArray(converted) ? converted[0] : converted;
    } catch {
      source = file; // conversion failed -> fall through to fallback below
    }
  }

  // Step 2 — try canvas compression (small output).
  try {
    return await canvasCompress(source, { maxPx, quality, timeoutMs });
  } catch {
    // Step 3 — couldn't compress; upload the original if it fits.
    if (file.size > MAX_ORIGINAL_BYTES) {
      throw new Error("IMAGE_TOO_BIG");
    }
    return await readAsDataURL(file);
  }
}
