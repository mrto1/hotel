import { HotelHome } from "@/components/public/HotelHome";
import { hotelFromSlug } from "@/src/lib/public-hotel";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  return <HotelHome {...await hotelFromSlug(slug, locale)} />;
}
