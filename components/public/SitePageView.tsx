import type { Hotel, SitePage } from "@/src/db/schema";
import { tr } from "@/src/domain/blocks";
import type { Locale } from "@/src/i18n/dict";
import { Shell } from "./Shell";
import { Blocks } from "./Blocks";

export function SitePageView({ hotel, page, locale, base }: { hotel: Hotel; page: SitePage; locale: Locale; base: string }) {
  return (
    <Shell hotel={hotel} locale={locale} base={base} path={page.slug ? `/${page.slug}` : ""} current={page.slug}>
      <Blocks blocks={page.blocks} hotel={hotel} lang={locale} base={base} pageTitle={page.slug ? tr(page.title, locale) : ""} />
    </Shell>
  );
}
