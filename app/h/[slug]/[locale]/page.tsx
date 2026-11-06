import { HotelHome } from "@/components/public/HotelHome";
import { hotelFromSlug } from "@/src/lib/public-hotel";

import { getPublicPage } from "@/src/services/site";
import { pageMetadata } from "@/src/lib/page-meta";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const ctx = await hotelFromSlug(slug, locale);
  return pageMetadata(ctx.hotel, await getPublicPage(ctx.hotel.id, ""), ctx.locale);
}

export default async function Page({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  return <HotelHome {...await hotelFromSlug(slug, locale)} />;
}
