import { expect, test } from "@playwright/test";

/** E2E mit PAYMENT_PROVIDER=fake und Seed-Daten (npm run db:reset). */
test("Gast sucht, bucht und storniert (Fake-Zahlung)", async ({ page }) => {
  await page.goto("/h/demo-gasthof/de");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Demo Gasthof");
  const d = new Date();
  d.setDate(d.getDate() + 20 + Math.floor(Math.random() * 200));
  while (d.getDay() === 6 || d.getDay() === 5) d.setDate(d.getDate() + 1); // Mindestnächte Sa vermeiden
  const ci = d.toISOString().slice(0, 10);
  d.setDate(d.getDate() + 2);
  const co = d.toISOString().slice(0, 10);
  await page.fill("#checkin", ci);
  await page.fill("#checkout", co);
  await page.selectOption("#adults", "2");
  await page.getByRole("button", { name: "Verfügbarkeit prüfen" }).click();
  await expect(page.getByRole("heading", { name: "Verfügbare Angebote" })).toBeVisible();
  const offer = page.locator("article.offer", { hasText: "Doppelzimmer · Flexibel" });
  await offer.getByText("Auswählen").click();
  await offer.locator("input[name=first_name]").fill("Erika");
  await offer.locator("input[name=last_name]").fill("Test");
  await offer.locator("input[name=email]").fill("erika@example.ch");
  await offer.locator("input[name=terms]").check();
  await offer.getByRole("button", { name: "Weiter zur Zahlung" }).click();
  await expect(page).toHaveURL(/\/b\/.+paid=1/);
  await expect(page.getByText("Ihre Buchung ist bestätigt")).toBeVisible();
  await page.waitForLoadState("networkidle"); // Hydrierung abwarten
  await page.getByRole("button", { name: "Buchung stornieren" }).click();
  await expect(page.getByText("Bei Stornierung jetzt erhalten Sie zurück")).toBeVisible();
  await page.getByRole("button", { name: "Ja, verbindlich stornieren" }).click();
  await expect(page.getByText("Storniert")).toBeVisible({ timeout: 10000 });
});
