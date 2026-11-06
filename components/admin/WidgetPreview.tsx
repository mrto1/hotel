"use client";
import { useEffect } from "react";

/** Lädt das Widget-Skript einmal, damit die Vorschau im Admin genau so aussieht wie auf der Hotel-Website */
export function WidgetPreview({ src, slug, mode }: { src: string; slug: string; mode: "button" | "search" }) {
  useEffect(() => {
    if (!document.querySelector(`script[src="${src}"]`)) {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      document.body.appendChild(s);
    }
  }, [src]);
  return <div data-pontivo={slug} data-mode={mode} data-target="_blank" />;
}
