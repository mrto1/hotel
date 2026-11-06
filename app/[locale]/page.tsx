import { HotelHome } from "@/components/public/HotelHome";
import { hotelFromHost } from "@/src/lib/public-hotel";

import { getPublicPage } from "@/src/services/site";
import { pageMetadata } from "@/src/lib/page-meta";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const ctx = await hotelFromHost(locale);
  return pageMetadata(ctx.hotel, await getPublicPage(ctx.hotel.id, ""), ctx.locale);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <HotelHome {...await hotelFromHost(locale)} />;
}
