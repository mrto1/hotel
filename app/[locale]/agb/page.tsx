import { LegalPage } from "@/components/public/LegalPage";
import { hotelFromHost } from "@/src/lib/public-hotel";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LegalPage {...await hotelFromHost(locale)} kind="agb" />;
}
