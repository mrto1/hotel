/** Englische Namen/Beschreibungen von Zimmern und Tarifen, Fallback Deutsch */
type WithI18n = { name: string; description?: string | null; i18n?: { en?: { name?: string; description?: string } } | null };

export function roomName(r: WithI18n, lang: string): string {
  return (lang === "en" && r.i18n?.en?.name) || r.name;
}
export function roomDescription(r: WithI18n, lang: string): string | null {
  return (lang === "en" && r.i18n?.en?.description) || r.description || null;
}
export function planName(p: { name: string; i18n?: { en?: { name?: string } } | null }, lang: string): string {
  return (lang === "en" && p.i18n?.en?.name) || p.name;
}
