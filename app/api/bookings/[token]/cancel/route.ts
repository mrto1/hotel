import { errorResponse, json } from "@/src/lib/http";
import { clientIp, rateLimit } from "@/src/lib/rate-limit";
import { cancelBooking, getBookingByToken } from "@/src/services/bookings";

export const dynamic = "force-dynamic";

/** SPEC 8: Storno durch Gast (5.7) */
export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!rateLimit(`cancel:${clientIp(req)}`)) return json({ error: "rate_limited" }, 429);
  try {
    const { token } = await ctx.params;
    const found = await getBookingByToken(token);
    if (!found) return json({ error: "not_found" }, 404);
    const r = await cancelBooking(found.booking.id, { by: "guest", actor: "guest" });
    return json({ status: "cancelled", refund_rappen: r.refundRappen, fee_rappen: r.feeRappen });
  } catch (e) {
    return errorResponse(e);
  }
}
