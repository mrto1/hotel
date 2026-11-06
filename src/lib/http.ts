import { ZodError } from "zod";
import { BookingError } from "../services/bookings";

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function errorResponse(e: unknown) {
  if (e instanceof BookingError) return json({ error: e.code }, e.httpStatus);
  if (e instanceof ZodError) return json({ error: "invalid_input", issues: e.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, 400);
  console.error(e);
  return json({ error: "internal" }, 500);
}
