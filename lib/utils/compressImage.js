// Client-side image compressor. Resizes to fit `maxPx` on the longest edge
// and re-encodes as JPEG base64. Hardened against the failure modes that
// silently hung signup on low-end / HEIC-camera phones:
//   - img.onerror (undecodable / HEIC that the browser can't draw to canvas)
//   - a hard timeout (decode that never fires either callback)
//   - getContext returning null (low memory)
//   - drawImage / toDataURL throwing (tainted canvas / OOM)
// Every exit path revokes the object URL and clears the timer.
//
// Rejects with Error("IMAGE_DECODE_FAILED") or Error("IMAGE_TIMEOUT") so
// callers can show a "pick a different photo" message instead of hanging.
export function compressImage(file, { maxPx = 1000, quality = 0.7, timeoutMs = 15000 } = {}) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    let settled = false;

    const cleanup = () => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
    };
    const fail = (err) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };
    const done = (value) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };

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
