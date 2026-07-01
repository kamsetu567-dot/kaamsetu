import { connectDB } from "@/lib/db/mongoose";
import Ad from "@/lib/models/Ad";
import { ok } from "@/lib/utils/apiResponse";

// Public, unauthenticated — ads are shown to anonymous visitors, so the
// impression/click beacon can't require a token. Fire-and-forget from AdSlot.
//
// Body: { event: "impression" | "click" }.
// Bad ids or unknown events are swallowed with a 200 so a tracking beacon can
// never break the page it's reporting from. We only ever $inc — no other
// fields are writable here, so there's nothing to abuse.
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    let event;
    try {
      ({ event } = await request.json());
    } catch {
      return ok({ tracked: false });
    }

    const field = event === "click" ? "clicks" : event === "impression" ? "impressions" : null;
    if (!field) return ok({ tracked: false });

    await connectDB();
    // findByIdAndUpdate tolerates a missing/garbage id by matching nothing.
    await Ad.findByIdAndUpdate(id, { $inc: { [field]: 1 } }).catch(() => {});

    return ok({ tracked: true, event });
  } catch (err) {
    // Never surface a 500 to a beacon — log and ack.
    console.error("POST /api/ads/[id]/track error:", err);
    return ok({ tracked: false });
  }
}
