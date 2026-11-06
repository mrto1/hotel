import { and, asc, eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { roomTypes, type Hotel } from "@/src/db/schema";
import { todayIn, addDays } from "@/src/domain/dates";
import { t, type Locale } from "@/src/i18n/dict";
import { Shell } from "./Shell";
import { SearchBar } from "./SearchBar";

export async function HotelHome({ hotel, locale, base }: { hotel: Hotel; locale: Locale; base: string }) {
  const d = t(locale);
  const content = hotel.content?.[locale] ?? {};
  const rooms = await db().select().from(roomTypes).where(and(eq(roomTypes.hotelId, hotel.id), eq(roomTypes.active, true))).orderBy(asc(roomTypes.sortOrder));
  const today = todayIn(hotel.timezone);
  return (
    <Shell hotel={hotel} locale={locale} base={base}>
      {hotel.content.photos?.[0] ? <img className="hero-photo" src={hotel.content.photos[0].url} alt={hotel.content.photos[0].alt ?? hotel.name} /> : null}
      <section className="hero">
        <h1>{content.headline ?? hotel.name}</h1>
        {content.intro ? <p>{content.intro}</p> : null}
        <span className="badge">{d.bestPrice}</span>
      </section>
      <SearchBar action={`${base}/${locale}/book`} locale={locale} today={today} defaults={{ checkin: addDays(today, 1), checkout: addDays(today, 3), adults: 2 }} />
      <section className="section">
        <h2>{d.rooms}</h2>
        <div className="grid">
          {rooms.map((r) => (
            <article key={r.id} className="card">
              {r.photos[0] ? <img className="room-photo" src={r.photos[0].url} alt={r.photos[0].alt ?? r.name} loading="lazy" /> : null}
              {r.photos.length > 1 ? (
                <div className="thumbs">
                  {r.photos.slice(1).map((p) => <a key={p.url} href={p.url} target="_blank"><img src={p.url} alt={p.alt ?? r.name} loading="lazy" /></a>)}
                </div>
              ) : null}
              <h3>{r.name}</h3>
              {r.description ? <p className="muted small">{r.description}</p> : null}
              <p className="small">{d.upTo} {r.maxOccupancy} {d.persons}</p>
            </article>
          ))}
        </div>
      </section>
    </Shell>
  );
}
