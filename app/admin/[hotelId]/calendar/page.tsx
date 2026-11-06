import { Fragment } from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHotel } from "@/src/auth/guard";
import { atLeast } from "@/src/auth/session";
import { calendarData, setBlocked, updateRates, type RateChange } from "@/src/services/inventory";
import { addDays, isDay, todayIn, weekday } from "@/src/domain/dates";
import { decimalToRappen, rappenToDecimal } from "@/src/domain/money";

export const dynamic = "force-dynamic";

const WD = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const DAYS = 90;

function tri(v: FormDataEntryValue | null): boolean | undefined {
  return v === "yes" ? true : v === "no" ? false : undefined;
}

async function saveRates(formData: FormData) {
  "use server";
  const hotelId = String(formData.get("hotelId"));
  const { actor } = await requireHotel(hotelId, "manager");
  const from = String(formData.get("from"));
  const to = String(formData.get("to"));
  const ratePlanId = String(formData.get("ratePlanId"));
  const back = `/admin/${hotelId}/calendar?from=${formData.get("viewFrom")}`;
  if (!isDay(from) || !isDay(to) || to < from) redirect(`${back}&msg=${encodeURIComponent("Ungültiger Zeitraum")}`);
  const change: RateChange = {};
  const price = String(formData.get("price") ?? "").trim();
  if (price) change.priceRappen = decimalToRappen(price.replace(",", "."));
  const minStay = String(formData.get("minStay") ?? "").trim();
  if (minStay) change.minStayArrival = Math.max(1, Number(minStay));
  const cta = tri(formData.get("cta"));
  const ctd = tri(formData.get("ctd"));
  const ss = tri(formData.get("stopSell"));
  if (cta !== undefined) change.closedToArrival = cta;
  if (ctd !== undefined) change.closedToDeparture = ctd;
  if (ss !== undefined) change.stopSell = ss;
  const weekdays = formData.getAll("wd").map(Number);
  let msg = "Keine Änderung angegeben";
  if (Object.keys(change).length) {
    const n = await updateRates(hotelId, ratePlanId, from, to, change, { weekdays, actor });
    msg = `${n} Tage aktualisiert`;
  }
  revalidatePath(`/admin/${hotelId}/calendar`);
  redirect(`${back}&msg=${encodeURIComponent(msg)}`);
}

async function saveBlock(formData: FormData) {
  "use server";
  const hotelId = String(formData.get("hotelId"));
  const { actor } = await requireHotel(hotelId, "manager");
  const from = String(formData.get("from"));
  const to = String(formData.get("to"));
  const back = `/admin/${hotelId}/calendar?from=${formData.get("viewFrom")}`;
  if (!isDay(from) || !isDay(to) || to < from) redirect(`${back}&msg=${encodeURIComponent("Ungültiger Zeitraum")}`);
  const n = await setBlocked(hotelId, String(formData.get("roomTypeId")), from, to, Number(formData.get("blocked") ?? 0), {
    weekdays: formData.getAll("wd").map(Number),
    actor,
  });
  revalidatePath(`/admin/${hotelId}/calendar`);
  redirect(`${back}&msg=${encodeURIComponent(`${n} Tage aktualisiert`)}`);
}

function Weekdays() {
  return (
    <div>
      <label>Wochentage (leer = alle)</label>
      <div className="weekdays">
        {[1, 2, 3, 4, 5, 6, 0].map((d) => (
          <label key={d}><input type="checkbox" name="wd" value={d} />{WD[d]}</label>
        ))}
      </div>
    </div>
  );
}

export default async function Calendar({ params, searchParams }: { params: Promise<{ hotelId: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { hotelId } = await params;
  const sp = await searchParams;
  const { hotel, role } = await requireHotel(hotelId);
  const today = todayIn(hotel.timezone);
  const from = sp.from && isDay(sp.from) ? sp.from : today;
  const cal = await calendarData(hotel.id, from, DAYS);
  const days = Array.from({ length: DAYS }, (_, i) => addDays(from, i));
  const invKey = new Map(cal.inventory.map((r) => [`${r.roomTypeId}|${r.night}`, r]));
  const rateKey = new Map(cal.rates.map((r) => [`${r.ratePlanId}|${r.night}`, r]));
  const canEdit = atLeast(role, "manager");

  return (
    <div className="stack">
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <h1 style={{ margin: 0 }}>Kalender</h1>
        <a className="btn secondary small" href={`?from=${addDays(from, -30)}`}>← 30 Tage</a>
        <a className="btn secondary small" href={`?from=${today}`}>Heute</a>
        <a className="btn secondary small" href={`?from=${addDays(from, 30)}`}>30 Tage →</a>
      </div>
      {sp.msg ? <p className="notice">{sp.msg}</p> : null}
      <div className="scroll-x">
        <table className="cal">
          <thead>
            <tr>
              <th className="sticky">Zimmertyp / Rateplan</th>
              {days.map((d) => (
                <th key={d} className={weekday(d) === 0 || weekday(d) === 6 ? "we" : ""}>
                  {WD[weekday(d)]}<br />{d.slice(8, 10)}.{d.slice(5, 7)}.
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cal.roomTypes.map((rt) => (
              <Fragment key={rt.id}>
                <tr>
                  <td className="sticky">{rt.name} <span className="muted">({rt.roomCount})</span><br /><span className="muted small">frei / gebucht / gesperrt</span></td>
                  {days.map((d) => {
                    const i = invKey.get(`${rt.id}|${d}`);
                    if (!i) return <td key={d} className="muted">–</td>;
                    const free = i.total - i.booked - i.blocked;
                    return (
                      <td key={d} className={free <= 0 ? "full" : ""} title={`frei ${free}, gebucht ${i.booked}, gesperrt ${i.blocked}`}>
                        {free}
                        <span className="muted"> /{i.booked}</span>
                        {i.blocked ? <span className="blk"> /{i.blocked}</span> : null}
                      </td>
                    );
                  })}
                </tr>
                {cal.ratePlans.filter((p) => p.roomTypeId === rt.id).map((p) => (
                  <tr key={p.id}>
                    <td className="sticky" style={{ fontWeight: 400 }}>↳ {p.name}</td>
                    {days.map((d) => {
                      const r = rateKey.get(`${p.id}|${d}`);
                      if (!r) return <td key={d} className="muted">–</td>;
                      const tags = [r.minStayArrival > 1 ? `min${r.minStayArrival}` : "", r.closedToArrival ? "CTA" : "", r.closedToDeparture ? "CTD" : "", r.stopSell ? "STOP" : ""].filter(Boolean);
                      return (
                        <td key={d} className={r.stopSell ? "ss" : ""}>
                          {rappenToDecimal(r.priceRappen).replace(/\.00$/, "")}
                          {tags.length ? <span className="tag">{tags.join(" ")}</span> : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {canEdit ? (
        <div className="grid">
          <form action={saveRates} className="card stack">
            <h3>Preise und Regeln setzen</h3>
            <input type="hidden" name="hotelId" value={hotel.id} />
            <input type="hidden" name="viewFrom" value={from} />
            <div>
              <label>Rateplan</label>
              <select name="ratePlanId" required>
                {cal.ratePlans.map((p) => (
                  <option key={p.id} value={p.id}>{cal.roomTypes.find((r) => r.id === p.roomTypeId)?.name} · {p.name}</option>
                ))}
              </select>
            </div>
            <div className="inline-form">
              <div><label>Von</label><input type="date" name="from" defaultValue={from} required /></div>
              <div><label>Bis (inkl.)</label><input type="date" name="to" defaultValue={addDays(from, 6)} required /></div>
            </div>
            <Weekdays />
            <div className="inline-form">
              <div><label>Preis CHF</label><input name="price" inputMode="decimal" placeholder="unverändert" /></div>
              <div><label>Mindestnächte</label><input name="minStay" type="number" min={1} placeholder="unverändert" /></div>
            </div>
            <div className="inline-form">
              {[["cta", "Anreise gesperrt"], ["ctd", "Abreise gesperrt"], ["stopSell", "Verkaufsstopp"]].map(([n, l]) => (
                <div key={n}>
                  <label>{l}</label>
                  <select name={n} defaultValue=""><option value="">unverändert</option><option value="yes">ja</option><option value="no">nein</option></select>
                </div>
              ))}
            </div>
            <button className="btn">Speichern</button>
          </form>

          <form action={saveBlock} className="card stack">
            <h3>Zimmer sperren / freigeben</h3>
            <input type="hidden" name="hotelId" value={hotel.id} />
            <input type="hidden" name="viewFrom" value={from} />
            <div>
              <label>Zimmertyp</label>
              <select name="roomTypeId" required>
                {cal.roomTypes.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.roomCount})</option>)}
              </select>
            </div>
            <div className="inline-form">
              <div><label>Von</label><input type="date" name="from" defaultValue={from} required /></div>
              <div><label>Bis (inkl.)</label><input type="date" name="to" defaultValue={from} required /></div>
            </div>
            <Weekdays />
            <div><label>Anzahl gesperrte Zimmer (0 = freigeben)</label><input name="blocked" type="number" min={0} defaultValue={1} required /></div>
            <button className="btn">Speichern</button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
