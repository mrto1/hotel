import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/src/db/client";
import { hotels } from "@/src/db/schema";
import { getHotelByHost } from "@/src/services/hotels";
import { env } from "@/src/env";

export const dynamic = "force-dynamic";

export default async function Root() {
  const hotel = await getHotelByHost((await headers()).get("host"));
  if (hotel) redirect(`/${hotel.defaultLanguage}`);
  // Plattform-Startseite. In der Entwicklung: Liste der Hotels zur Vorschau.
  const list = env().NODE_ENV === "production" ? [] : await db().select().from(hotels).orderBy(hotels.name);
  return (
    <main className="wrap" style={{ padding: "48px 16px" }}>
      <h1>{env().PLATFORM_NAME}</h1>
      <h2 style={{ fontWeight: 400 }}>Direktbuchung für Hotels</h2>
      <p className="muted">Website, Buchungsmaschine und Channel-Abgleich für kleine Hotels. 1 % pro Buchung.</p>
      {list.length ? (
        <section className="card" style={{ marginTop: 24 }}>
          <h2>Vorschau (nur Entwicklung)</h2>
          <ul>
            {list.map((h) => (
              <li key={h.id}>
                <a href={`/h/${h.slug}/de`}>{h.name}</a> <span className="muted small">({h.status}{h.primaryDomain ? `, ${h.primaryDomain}` : ""})</span>
              </li>
            ))}
          </ul>
          <p><a href="/admin">Zum Admin</a></p>
        </section>
      ) : null}
    </main>
  );
}
