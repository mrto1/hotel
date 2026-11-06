import { formatChf } from "../domain/money";
import { cancellationPolicyText } from "../domain/cancellation";
import { formatDay, type Locale } from "../i18n/dict";
import type { Booking, Hotel, RatePlan, RoomType } from "../db/schema";

/**
 * E-Mail-Texte DE/EN (SPEC 10).
 */
// ASSUMPTION: Einfache HTML-Templates in TypeScript statt React Email – keine zusätzliche Abhängigkeit für v1.

export type EmailContext = {
  hotel: Hotel;
  booking?: Booking | null;
  guestName?: string | null;
  roomType?: RoomType | null;
  plan?: RatePlan | null;
  data: Record<string, unknown>;
  baseUrl: string;
};

export type Rendered = { subject: string; text: string; html: string };

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function summary(c: EmailContext, l: Locale): string[] {
  const b = c.booking;
  if (!b) return [];
  const de = l === "de";
  return [
    `${de ? "Buchungsnummer" : "Booking number"}: ${b.reference}`,
    `${de ? "Anreise" : "Check-in"}: ${formatDay(b.checkin, l)} (${c.hotel.checkinTime.slice(0, 5)})`,
    `${de ? "Abreise" : "Check-out"}: ${formatDay(b.checkout, l)} (${c.hotel.checkoutTime.slice(0, 5)})`,
    `${de ? "Zimmer" : "Room"}: ${c.roomType?.name ?? "-"}${c.plan ? ` · ${c.plan.name}` : ""}`,
    `${de ? "Personen" : "Guests"}: ${b.adults}${b.children ? ` + ${b.children} ${de ? "Kinder" : "children"}` : ""}`,
    `${de ? "Total" : "Total"}: ${formatChf(b.totalRappen)}${b.touristTaxRappen ? ` (${de ? "inkl. Kurtaxe" : "incl. tourist tax"} ${formatChf(b.touristTaxRappen)})` : ""}`,
  ];
}

function wrap(c: EmailContext, l: Locale, subject: string, paras: string[], lines: string[] = [], link?: { href: string; label: string }): Rendered {
  const text = [...paras, "", ...lines, link ? `\n${link.label}: ${link.href}` : "", "", c.hotel.name, c.hotel.contactEmail].join("\n");
  const html = `<!doctype html><html lang="${l}"><body style="font-family:Arial,sans-serif;color:#1f2a2e;max-width:560px;margin:0 auto;padding:16px">
<h2 style="font-family:Georgia,serif">${esc(c.hotel.name)}</h2>
${paras.map((p) => `<p>${esc(p)}</p>`).join("")}
${lines.length ? `<table style="border-collapse:collapse;width:100%">${lines.map((x) => { const [k, ...v] = x.split(": "); return `<tr><td style="padding:4px 0;color:#5f6b70">${esc(k)}</td><td style="padding:4px 0;text-align:right">${esc(v.join(": "))}</td></tr>`; }).join("")}</table>` : ""}
${link ? `<p style="margin-top:24px"><a href="${esc(link.href)}" style="background:#2f5d50;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">${esc(link.label)}</a></p>` : ""}
<p style="color:#5f6b70;font-size:13px;margin-top:32px">${esc(c.hotel.name)} · ${esc(c.hotel.contactEmail)}${c.hotel.contactPhone ? " · " + esc(c.hotel.contactPhone) : ""}</p>
</body></html>`;
  return { subject, text, html };
}

export function render(template: string, lang: string, c: EmailContext): Rendered {
  const l: Locale = lang === "en" ? "en" : "de";
  const de = l === "de";
  const b = c.booking;
  const link = b ? { href: `${c.baseUrl}/b/${b.publicToken}`, label: de ? "Buchung ansehen" : "View booking" } : undefined;
  const hi = c.guestName ? (de ? `Guten Tag ${c.guestName}` : `Dear ${c.guestName}`) : de ? "Guten Tag" : "Hello";
  const money = (k: string) => formatChf(Number(c.data[k] ?? 0));

  switch (template) {
    case "booking_confirmed":
      return wrap(c, l, de ? `Buchungsbestätigung ${b?.reference}` : `Booking confirmation ${b?.reference}`,
        [hi + ",", de ? "vielen Dank für Ihre Direktbuchung. Wir freuen uns auf Ihren Besuch." : "thank you for booking direct. We look forward to welcoming you."],
        [...summary(c, l), ...(c.plan ? [`${de ? "Storno" : "Cancellation"}: ${cancellationPolicyText(c.plan, l)}`] : [])], link);
    case "hotel_new_booking":
      return wrap(c, l, `${de ? "Neue Buchung" : "New booking"} ${b?.reference} (${b?.source})`,
        [de ? `Neue Buchung von ${c.guestName ?? "Gast"} über ${b?.source}.` : `New booking from ${c.guestName ?? "guest"} via ${b?.source}.`],
        summary(c, l));
    case "booking_cancelled":
      return wrap(c, l, de ? `Stornierung ${b?.reference}` : `Cancellation ${b?.reference}`,
        [hi + ",", de ? `die Buchung ${b?.reference} wurde storniert. Rückerstattung: ${money("refundRappen")}.` : `booking ${b?.reference} has been cancelled. Refund: ${money("refundRappen")}.`],
        summary(c, l), link);
    case "pre_arrival":
      return wrap(c, l, de ? `Bald ist es so weit – ${c.hotel.name}` : `See you soon – ${c.hotel.name}`,
        [hi + ",", de ? `in wenigen Tagen reisen Sie an. Check-in ab ${c.hotel.checkinTime.slice(0, 5)} Uhr.` : `you arrive in a few days. Check-in from ${c.hotel.checkinTime.slice(0, 5)}.`],
        summary(c, l), link);
    case "post_stay":
      return wrap(c, l, de ? `Danke für Ihren Besuch – ${c.hotel.name}` : `Thank you for staying – ${c.hotel.name}`,
        [hi + ",", de ? "vielen Dank für Ihren Aufenthalt. Beim nächsten Mal direkt buchen und den besten Preis sichern." : "thank you for your stay. Book direct next time for the best price."],
        [], { href: c.baseUrl, label: de ? "Wieder buchen" : "Book again" });
    case "overbooking_alert":
      return wrap(c, l, `${de ? "ÜBERBUCHUNG" : "OVERBOOKING"} ${b?.reference ?? ""}`,
        [de ? "Eine Buchung aus einem Portal hat eine Überbuchung erzeugt. Bitte sofort prüfen." : "A channel booking caused an overbooking. Please check immediately."], summary(c, l));
    case "late_payment_refunded":
      return wrap(c, l, de ? `Zahlung erstattet ${b?.reference}` : `Payment refunded ${b?.reference}`,
        [hi + ",", de ? `Ihre Zahlung ist nach Ablauf der Reservierung eingegangen und das Zimmer war nicht mehr frei. Wir haben ${money("refundRappen")} vollständig zurückerstattet.` : `Your payment arrived after the reservation expired and the room was no longer available. We have fully refunded ${money("refundRappen")}.`],
        summary(c, l));
    case "dispute_alert":
      return wrap(c, l, de ? "Zahlung angefochten (Dispute)" : "Payment disputed",
        [de ? `Eine Zahlung über ${money("amountRappen")} wurde angefochten (Grund: ${c.data.reason}). Bitte im Stripe-Dashboard reagieren.` : `A payment of ${money("amountRappen")} was disputed (reason: ${c.data.reason}). Please respond in the Stripe dashboard.`], summary(c, l));
    case "login_link":
      return wrap(c, l, de ? "Ihr Login-Link" : "Your login link",
        [de ? "Klicken Sie auf den Link, um sich anzumelden. Er ist 15 Minuten gültig und nur einmal verwendbar." : "Click the link to sign in. It is valid for 15 minutes and can be used once."],
        [], { href: String(c.data.link), label: de ? "Anmelden" : "Sign in" });
    case "channex_alert":
      return wrap(c, l, `[Channex] ${String(c.data.subject)}${c.data.hotel ? ` – ${c.data.hotel}` : ""}`,
        [String(c.data.subject), String(c.data.details ?? "")]);
    default:
      throw new Error(`Unbekanntes Template ${template}`);
  }
}
