"use client";
export function PrintButton() {
  return <button className="btn" onClick={() => window.print()}>Drucken / Als PDF speichern</button>;
}
