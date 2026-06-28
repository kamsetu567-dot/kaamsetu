import AdminSettings from "@/lib/models/AdminSettings";

// Returns true if the given mobile number is on the admin Security page's
// Fraud Block List. Reads AdminSettings.key="security_settings" — the same
// key the Security page writes to. The list is small (admin curates by hand),
// so a fresh read on every auth attempt is fine.
//
// The list is stored as strings; the admin UI accepts mobile numbers OR user
// IDs. We only match against mobile here — IDs are a future enhancement. The
// admin Security page banner already calls out that matching is mobile-only.
export async function isMobileBlocked(mobile) {
  if (!mobile) return false;
  try {
    const doc = await AdminSettings.findOne({ key: "security_settings" }).lean();
    const list = Array.isArray(doc?.value?.fraudList) ? doc.value.fraudList : [];
    return list.includes(String(mobile));
  } catch {
    // Never block a real user because the DB hiccupped — fail open. The
    // alternative (failing closed) would lock everyone out on a transient
    // Mongo error, which is worse than briefly missing a fraud block.
    return false;
  }
}
