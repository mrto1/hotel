import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  redirect(`/admin/${hotelId}/bookings`);
}
