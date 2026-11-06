import { redirect } from "next/navigation";
import { requireHotel } from "@/src/auth/guard";
import { atLeast } from "@/src/auth/session";
import { createImprintPage, createPage, deletePage, ensureHomePage, listPages, movePage, SiteError } from "@/src/services/site";
import { publicBase } from "@/src/services/brand";
import { tr } from "@/src/domain/blocks";

export const dynamic = "force-dynamic";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

async function run(f: FormData, fn: (c: Awaited<ReturnType<typeof requireHotel>>) => Promise<string | { to: string }>) {
  const c = await requireHotel(s(f, "hotelId"), "manager");
  let r: string | { to: string };
  try {
    r = await fn(c);
  } catch (e) {
    if (!(e instanceof SiteError)) throw e;
    r = `Nicht möglich: ${e.message}`;
  }
  redirect(typeof r === "string" ? `/admin/${c.hotel.id}/site?msg=${encodeURIComponent(r)}` : r.to);
}

async function startHome(f: FormData) {
  "use server";
  await run(f, async ({ hotel, actor }) => ({ to: `/admin/${hotel.id}/site/${(await ensureHomePage(hotel, actor)).id}` }));
}
async function newPage(f: FormData) {
  "use server";
  await run(f, async ({ hotel, actor }) => {
    await ensureHomePage(hotel, actor);
    return { to: `/admin/${hotel.id}/site/${(await createPage(hotel.id, s(f, "title"), actor)).id}` };
  });
}
async function newImprint(f: FormData) {
  "use server";
  await run(f, async ({ hotel, actor }) => {
    await ensureHomePage(hotel, actor);
    return { to: `/admin/${hotel.id}/site/${(await createImprintPage(hotel, actor)).id}?msg=${encodeURIComponent("Impressum angelegt – bitte die Angaben in [Klammern] ergänzen")}` };
  });
}
async function move(f: FormData) {
  "use server";
  await run(f, async ({ hotel, actor }) => {
    await movePage(hotel.id, s(f, "pageId"), s(f, "dir") === "up" ? -1 : 1, actor);
    return "Reihenfolge geändert";
  });
}
async function remove(f: FormData) {
  "use server";
  await run(f, async ({ hotel, actor }) => {
    await deletePage(hotel.id, s(f, "pageId"), actor);
    return "Seite gelöscht";
  });
}

export default async function Site({ params, searchParams }: { params: Promise<{ hotelId: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { hotelId } = await params;
  const sp = await searchParams;
  const { hotel, role } = await requireHotel(hotelId);
  const canEdit = atLeast(role, "manager");
  const pages = await listPages(hotel.id);
  const home = pages.find((p) => p.slug === "");
  const others = pages.filter((p) => p.slug !== "");
  const base = publicBase(hotel);
  const hidden = <input type="hidden" name="hotelId" value={hotel.id} />;
  const bookingOnly = hotel.content.brand?.mode === "booking_only";

  return (
    <div className="stack">
      <h1>Website</h1>
      {sp.msg ? <p className={`notice ${sp.msg.startsWith("Nicht") ? "warn" : ""}`}>{sp.msg}</p> : null}
      {bookingOnly ? <p className="notice warn small">Dieses Hotel nutzt «nur Buchung» (siehe Einbinden). Seiten hier erscheinen trotzdem unter der Pontivo-Adresse, aber nicht im Menü der Buchungsseite.</p> : null}

      <section className="card stack">
        <h2>Startseite</h2>
        {home ? (
          <p><a className="btn" href={`/admin/${hotel.id}/site/${home.id}`}>Startseite bearbeiten</a> <a href={`${base}/de`} target="_blank">ansehen</a></p>
        ) : canEdit ? (
          <form action={startHome}>{hidden}<p className="small">Heute zeigt die Startseite Titel, Einleitung und Zimmer aus den Einstellungen. Mit dem Editor gestalten Sie sie frei aus Bausteinen – die bisherigen Texte werden übernommen.</p><button className="btn">Startseite gestalten</button></form>
        ) : null}
      </section>

      <section className="card stack">
        <h2>Weitere Seiten</h2>
        {others.length ? (
          <table className="table">
            <thead><tr><th>Seite</th><th>Adresse</th><th>Menü</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {others.map((p, i) => (
                <tr key={p.id}>
                  <td><a href={`/admin/${hotel.id}/site/${p.id}`}>{tr(p.title, "de") || tr(p.title, "en")}</a></td>
                  <td className="small"><a href={`${base}/de/${p.slug}`} target="_blank">/{p.slug}</a></td>
                  <td>{p.showInNav ? "ja" : "nein"}</td>
                  <td>{p.published ? "sichtbar" : <span className="badge warn">Entwurf</span>}</td>
                  <td>
                    {canEdit ? (
                      <div className="inline-form" style={{ gap: 4 }}>
                        <form action={move}>{hidden}<input type="hidden" name="pageId" value={p.id} /><input type="hidden" name="dir" value="up" /><button className="btn secondary small" disabled={i === 0} aria-label="nach oben">↑</button></form>
                        <form action={move}>{hidden}<input type="hidden" name="pageId" value={p.id} /><input type="hidden" name="dir" value="down" /><button className="btn secondary small" disabled={i === others.length - 1} aria-label="nach unten">↓</button></form>
                        <form action={remove}>{hidden}<input type="hidden" name="pageId" value={p.id} /><button className="btn secondary small">Löschen</button></form>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="muted small">Noch keine weiteren Seiten. Typisch sind z. B. Restaurant, Lage & Anreise, Angebote, Seminare.</p>}
        {canEdit ? (
          <div className="inline-form">
            <form action={newPage} className="inline-form">{hidden}<div><label>Neue Seite</label><input name="title" placeholder="z. B. Restaurant" required /></div><button className="btn small">Anlegen</button></form>
            {!others.some((p) => p.slug === "impressum") ? <form action={newImprint}>{hidden}<button className="btn secondary small">Impressum anlegen</button></form> : null}
          </div>
        ) : null}
        <p className="muted small">Die Reihenfolge hier ist die Reihenfolge im Menü. AGB und Datenschutz gibt es automatisch.</p>
      </section>
    </div>
  );
}
