import { LegalPage } from "@/components/public/LegalPage";
import { hotelFromSlug } from "@/src/lib/public-hotel";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  return <LegalPage {...await hotelFromSlug(slug, locale)} kind="datenschutz" />;
}
