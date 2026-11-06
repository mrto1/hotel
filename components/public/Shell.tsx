import type { Hotel } from "@/src/db/schema";
import { t, type Locale } from "@/src/i18n/dict";
import { env } from "@/src/env";

export function Shell({ hotel, locale, base, path = "", children }: { hotel: Hotel; locale: Locale; base: string; path?: string; children: React.ReactNode }) {
  const d = t(locale);
  return (
    <>
      <header className="site-head">
        <div className="wrap">
          <a className="brand" href={`${base}/${locale}`}>{hotel.name}</a>
          <nav className="lang" aria-label="Sprache">
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
          <br />
          <a href={`${base}/${locale}/agb`}>{locale === "de" ? "AGB" : "Terms"}</a> · <a href={`${base}/${locale}/datenschutz`}>{locale === "de" ? "Datenschutz" : "Privacy"}</a>
          <span className="small"> · {locale === "de" ? "Buchung über" : "Booking by"} {env().PLATFORM_NAME}</span>
        </div>
      </footer>
    </>
  );
}
