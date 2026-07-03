// Client-side loader for Razorpay's checkout.js. The SDK isn't bundled — it's
// injected on demand when the user actually clicks "Pay", so it never costs
// anything on pages that don't take payments.
//
// Idempotent: resolves immediately if window.Razorpay already exists; reuses a
// single in-flight <script> so rapid double-clicks don't inject twice.

const SRC = "https://checkout.razorpay.com/v1/checkout.js";
let loadingPromise = null;

export function loadRazorpay() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => { loadingPromise = null; resolve(false); });
      return;
    }
    const script = document.createElement("script");
    script.src = SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => { loadingPromise = null; resolve(false); };
    document.body.appendChild(script);
  });
  return loadingPromise;
}
