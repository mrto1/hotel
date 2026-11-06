"use client";
import { useId, useState } from "react";
import s from "./marketing.module.css";

const chf = (n: number) => "CHF " + Math.round(n).toLocaleString("de-CH").replace(/’/g, "'");

/** Ersparnis-Rechner: wie viel Provision bleibt beim Hotel, wenn ein Teil der Portal-Buchungen direkt kommt */
export function SavingsCalculator({ feePercent }: { feePercent: number }) {
  const id = useId();
  const [revenue, setRevenue] = useState(250_000);
  const [commission, setCommission] = useState(17);
  const [shift, setShift] = useState(30);

  const moved = (revenue * shift) / 100;
  const portalCost = (moved * commission) / 100;
  const pontivoCost = (moved * feePercent) / 100;
  const saved = portalCost - pontivoCost;

  return (
    <div className={s.calc}>
      <div>
        <div className={s.field}>
          <label htmlFor={`${id}-rev`}>
            Umsatz über Buchungsportale pro Jahr <output htmlFor={`${id}-rev`}>{chf(revenue)}</output>
          </label>
          <input id={`${id}-rev`} type="range" min={20_000} max={1_500_000} step={10_000} value={revenue} onChange={(e) => setRevenue(Number(e.target.value))} />
        </div>
        <div className={s.field}>
          <label htmlFor={`${id}-com`}>
            Provision des Portals <output htmlFor={`${id}-com`}>{commission} %</output>
          </label>
          <input id={`${id}-com`} type="range" min={10} max={25} step={1} value={commission} onChange={(e) => setCommission(Number(e.target.value))} />
          <p className={s.fieldHint}>Steht in Ihrer Monatsrechnung des Portals.</p>
        </div>
        <div className={s.field}>
          <label htmlFor={`${id}-shift`}>
            Anteil, der künftig direkt bucht <output htmlFor={`${id}-shift`}>{shift} %</output>
          </label>
          <input id={`${id}-shift`} type="range" min={5} max={80} step={5} value={shift} onChange={(e) => setShift(Number(e.target.value))} />
          <p className={s.fieldHint}>Gäste, die Sie auf Google finden und heute trotzdem übers Portal buchen.</p>
        </div>
      </div>
      <div className={s.result} aria-live="polite">
        <div>Bleibt zusätzlich bei Ihnen, pro Jahr</div>
        <div className={s.resultBig}>{chf(saved)}</div>
        <table className={s.resultRows}>
          <tbody>
            <tr><td>Direkt gebuchter Umsatz</td><td>{chf(moved)}</td></tr>
            <tr><td>Bisher Provision ans Portal ({commission} %)</td><td>{chf(portalCost)}</td></tr>
            <tr><td>Neu Gebühr Pontivo ({feePercent} %)</td><td>{chf(pontivoCost)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
