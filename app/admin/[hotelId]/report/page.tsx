import { requireHotel } from "@/src/auth/guard";
import { isMonth, monthlyReport } from "@/src/services/report";
import { todayIn } from "@/src/domain/dates";
import { ReportView } from "@/components/admin/ReportView";

export const dynamic = "force-dynamic";

function shift(month: string, n: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

export default async function Report({ params, searchParams }: { params: Promise<{ hotelId: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { hotelId } = await params;
  const sp = await searchParams;
  const { hotel } = await requireHotel(hotelId, "manager");
  const month = isMonth(sp.month) ? sp.month : todayIn(hotel.timezone).slice(0, 7);
  const r = await monthlyReport(hotel.id, month);
  return (
    <div className="stack">
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <h1 style={{ margin: 0 }}>Monatsabrechnung</h1>
        <a className="btn secondary small" href={`?month=${shift(month, -1)}`}>←</a>
        <form method="get"><input type="month" name="month" defaultValue={month} style={{ width: 170 }} /></form>
        <a className="btn secondary small" href={`?month=${shift(month, 1)}`}>→</a>
        <a className="btn small" href={`/admin/${hotel.id}/report/csv?month=${month}`}>CSV</a>
        <a className="btn small" href={`/admin/${hotel.id}/report/print?month=${month}`} target="_blank">PDF / Drucken</a>
      </div>
      <p className="muted small">Gezählt werden Buchungen, die im Monat bestätigt wurden (Zeitzone des Hotels). Die Plattformgebühr fällt nur bei Direktbuchungen an und wird bei Rückerstattung anteilig zurückgegeben.</p>
      <ReportView r={r} />
    </div>
  );
}
