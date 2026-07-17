// The one place that knows how subscription days are added.
//
// This rule was copy-pasted across the payment activation, the admin "extend"
// action and the admin UI's preview; the referral reward would have made a
// fourth. Keeping it in one pure function means the three grant paths — paid,
// admin-comped, and referral bonus — can never drift apart.
//
// The rule: stack on an existing FUTURE expiry, so renewing early never costs
// the worker the days they've already got. If the expiry is null (never
// subscribed) or already in the past (lapsed), start from now — a lapsed
// subscription gets no retroactive credit for the dead time.
//
// Fixed 24h arithmetic, not calendar-aware — matches the existing behaviour;
// DST/timezones are not considered anywhere in this codebase.
export function computeNewExpiry(currentExpiry, days, now = new Date()) {
  // Tolerate a string/number expiry: values that have crossed JSON (a .lean()
  // doc or an API payload) arrive as strings, where .getTime() would throw.
  const current = currentExpiry ? new Date(currentExpiry) : null;
  const base = current && current > now ? current : now;
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}
