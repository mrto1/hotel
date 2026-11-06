import { errorResponse, json } from "@/src/lib/http";
import { cancellationPreview, getBookingByToken } from "@/src/services/bookings";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;
    const found = await getBookingByToken(token);
    if (!found) return json({ error: "not_found" }, 404);
    const q = await cancellationPreview(found.booking.id, { by: "guest" });
    return json({
      cancellable: q.cancellable,
      reason: q.reason ?? null,
      refund_rappen: q.refundRappen,
      fee_rappen: q.feeRappen,
      free: q.free,
      deadline: q.deadline?.toISOString() ?? null,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
