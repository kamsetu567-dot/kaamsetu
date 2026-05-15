export function createRateLimit(maxRequests, windowMs) {
  const store = new Map();
  return function check(key) {
    const now = Date.now();
    const hits = (store.get(key) || []).filter(t => now - t < windowMs);
    if (hits.length >= maxRequests) {
      return { allowed: false, retryAfter: Math.ceil((hits[0] + windowMs - now) / 1000) };
    }
    hits.push(now);
    store.set(key, hits);
    return { allowed: true };
  };
}
