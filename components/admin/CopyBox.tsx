"use client";
import { useState } from "react";

/** Code oder Link mit Kopier-Knopf */
export function CopyBox({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="copybox">
      <pre aria-label={label}><code>{text}</code></pre>
      <button
        type="button"
        className="btn secondary small"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setDone(true);
            setTimeout(() => setDone(false), 2000);
          } catch {
            /* Zwischenablage nicht erlaubt: Text bleibt markierbar */
          }
        }}
      >
        {done ? "Kopiert" : "Kopieren"}
      </button>
    </div>
  );
}
