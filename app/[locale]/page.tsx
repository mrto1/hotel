import { HotelHome } from "@/components/public/HotelHome";
import { hotelFromHost } from "@/src/lib/public-hotel";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <HotelHome {...await hotelFromHost(locale)} />;
}
