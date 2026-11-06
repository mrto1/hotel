import { notFound } from "next/navigation";
import { SitePageView } from "@/components/public/SitePageView";
import { hotelFromHost } from "@/src/lib/public-hotel";
import { getPublicPage } from "@/src/services/site";
import { pageMetadata } from "@/src/lib/page-meta";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ locale: string; page: string }> };

export async function generateMetadata({ params }: P) {
  const { locale, page } = await params;
  const ctx = await hotelFromHost(locale);
  return pageMetadata(ctx.hotel, await getPublicPage(ctx.hotel.id, page), ctx.locale);
}

export default async function Page({ params }: P) {
  const { locale, page } = await params;
  const ctx = await hotelFromHost(locale);
  const p = await getPublicPage(ctx.hotel.id, page);
  if (!p || p.slug === "") notFound();
  return <SitePageView {...ctx} page={p} />;
}
