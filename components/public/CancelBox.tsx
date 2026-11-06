"use client";
import { useState } from "react";
import { t, type Locale } from "@/src/i18n/dict";

function chf(r: number) {
  return "CHF " + (r / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

export function CancelBox({ token, locale }: { token: string; locale: Locale }) {
  const d = t(locale);
  const [preview, setPreview] = useState<{ cancellable: boolean; refund_rappen: number; fee_rappen: number } | null>(null);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function load() {
    const r = await fetch(`/api/bookings/${token}/cancel-preview`);
    if (r.ok) setPreview(await r.json());
    else setState("error");
  }
  async function cancel() {
    setState("busy");
    const r = await fetch(`/api/bookings/${token}/cancel`, { method: "POST" });
    if (r.ok) {
      setState("done");
      setTimeout(() => window.location.reload(), 800);
    } else setState("error");
  }

  if (state === "done") return <p className="notice">{d.cancelled}</p>;
  if (!preview) return <button className="btn secondary" onClick={load}>{d.cancel}</button>;
  if (!preview.cancellable) return <p className="notice warn">{d.error}</p>;
  return (
    <div className="notice warn">
      <p>{d.cancelPreview} <strong>{chf(preview.refund_rappen)}</strong></p>
      <button className="btn danger" onClick={cancel} disabled={state === "busy"}>{d.cancelConfirm}</button>
      {state === "error" ? <p>{d.error}</p> : null}
    </div>
  );
}
