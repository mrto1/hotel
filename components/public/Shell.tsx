import type { Hotel } from "@/src/db/schema";
import { t, type Locale } from "@/src/i18n/dict";
import { env } from "@/src/env";
import { HEX, inkOn, readableOnWhite } from "@/src/domain/brand";

/** Rahmen der Hotel-Seiten: Kopf mit Logo, Fusszeile, Erscheinungsbild des Hotels (Farbe, Logo) */
export function Shell({ hotel, locale, base, path = "", children }: { hotel: Hotel; locale: Locale; base: string; path?: string; children: React.ReactNode }) {
  const d = t(locale);
  const brand = hotel.content?.brand ?? {};
  const color = brand.color && HEX.test(brand.color) ? brand.color : null;
  const bookingOnly = brand.mode === "booking_only" && !!brand.websiteUrl;
  const style = color
    ? ({ "--brand": color, "--brand-ink": inkOn(color), "--brand-link": readableOnWhite(color) } as React.CSSProperties)
    : undefined;
  const homeHref = bookingOnly ? brand.websiteUrl! : `${base}/${locale}`;
  return (
    <div className={color ? "branded" : undefined} style={style}>
      <header className="site-head">
        <div className="wrap">
          <a className="brand" href={homeHref}>
            {brand.logoUrl ? <img className="brand-logo" src={brand.logoUrl} alt={hotel.name} /> : hotel.name}
          </a>
          <nav className="lang" aria-label="Sprache">
            {bookingOnly ? <a href={brand.websiteUrl}>{locale === "de" ? "Zur Website" : "Back to website"}</a> : null}
            {(["de", "en"] as const).map((l) => (
              <a key={l} href={`${base}/${l}${path}`} aria-current={l === locale}>{l.toUpperCase()}</a>
            ))}
          </nav>
        </div>
      </header>
      <main className="wrap">{children}</main>
      <footer className="foot">
        <div className="wrap">
          <strong>{hotel.name}</strong>
          {hotel.addressLine ? <> · {hotel.addressLine}</> : null}
          {hotel.city ? <> · {hotel.postalCode} {hotel.city}</> : null}
          <br />
          {d.contact}: <a href={`mailto:${hotel.contactEmail}`}>{hotel.contactEmail}</a>
          {hotel.contactPhone ? <> · {hotel.contactPhone}</> : null}
          {bookingOnly ? <> · <a href={brand.websiteUrl}>{brand.websiteUrl!.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a></> : null}
          <br />
          <a href={`${base}/${locale}/agb`}>{locale === "de" ? "AGB" : "Terms"}</a> · <a href={`${base}/${locale}/datenschutz`}>{locale === "de" ? "Datenschutz" : "Privacy"}</a>
          <span className="small"> · {locale === "de" ? "Buchung über" : "Booking by"} {env().PLATFORM_NAME}</span>
        </div>
      </footer>
    </div>
  );
}
