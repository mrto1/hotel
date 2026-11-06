import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db, closeDb } from "../../src/db/client";
import { hotels } from "../../src/db/schema";
import { contrast, inkOn, readableOnWhite } from "../../src/domain/brand";
import { publicBase, setLogo, updateBrand } from "../../src/services/brand";
import { GET as widget } from "../../app/widget/[file]/route";
import { makeHotel } from "../helpers";

afterAll(closeDb);

describe("Erscheinungsbild", () => {
  it("Schrift auf Markenfarbe und Linkfarbe sind lesbar", () => {
    expect(inkOn("#962e4a")).toBe("#ffffff");
    expect(inkOn("#f5d90a")).toBe("#1f2a2e");
    for (const c of ["#f5d90a", "#a0e0ff", "#ffffff", "#962e4a"]) expect(contrast(readableOnWhite(c), "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });

  it("Modus «nur Buchung» braucht die Website-Adresse; Farbe wird geprüft", async () => {
    const h = await makeHotel();
    await expect(updateBrand(h.hotel, { mode: "booking_only", color: null, websiteUrl: null }, "t")).rejects.toThrow(/Website/);
    await expect(updateBrand(h.hotel, { mode: "website", color: "red", websiteUrl: null }, "t")).rejects.toThrow();
    await expect(updateBrand(h.hotel, { mode: "booking_only", color: null, websiteUrl: "javascript:alert(1)" }, "t")).rejects.toThrow();
    await updateBrand(h.hotel, { mode: "booking_only", color: "#962e4a", websiteUrl: "https://www.hotel.example" }, "t");
    await setLogo(h.hotel.id, "/media/x/logo.png", "t");
    const [after] = await db().select().from(hotels).where(eq(hotels.id, h.hotel.id));
    expect(after.content.brand).toEqual({ mode: "booking_only", color: "#962e4a", websiteUrl: "https://www.hotel.example", logoUrl: "/media/x/logo.png" });
    // Fotos und Texte bleiben erhalten
    expect(after.content.de).toEqual(h.hotel.content.de);
  });

  it("Widget-Skript enthält die Hotel-Konfiguration, unbekannte Hotels → 404", async () => {
    const h = await makeHotel();
    await updateBrand(h.hotel, { mode: "booking_only", color: "#962e4a", websiteUrl: "https://www.hotel.example" }, "t");
    const res = await widget(new Request("http://x"), { params: Promise.resolve({ file: `${h.hotel.slug}.js` }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/javascript/);
    const js = await res.text();
    expect(js).toContain(`"slug":"${h.hotel.slug}"`);
    expect(js).toContain('"color":"#962e4a"');
    expect(js).toContain(`"base":"${publicBase(h.hotel)}"`);
    expect(js).not.toContain("__CONFIG__");
    expect((await widget(new Request("http://x"), { params: Promise.resolve({ file: "gibt-es-nicht.js" }) })).status).toBe(404);
    expect((await widget(new Request("http://x"), { params: Promise.resolve({ file: "<script>.js" }) })).status).toBe(404);
  });
});
