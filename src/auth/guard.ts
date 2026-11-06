import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getHotelById } from "../services/hotels";
import { atLeast, getUser, readSessionValue, roleIn, SESSION_COOKIE, type Role } from "./session";

export async function currentUserId(): Promise<string | null> {
  return readSessionValue((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function requireUser() {
  const id = await currentUserId();
  const user = id ? await getUser(id) : null;
  if (!user) redirect("/admin/login");
  return user;
}

/** Admin-Seiten und Server Actions: Zugriff auf genau dieses Hotel mit Mindestrolle, sonst 404 */
export async function requireHotel(hotelId: string, min: Role = "staff") {
  const user = await requireUser();
  const role = await roleIn(user.id, hotelId);
  if (!atLeast(role, min)) notFound();
  const hotel = await getHotelById(hotelId);
  if (!hotel) notFound();
  return { user, role: role!, hotel, actor: `user:${user.id}` };
}
