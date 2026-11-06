# Channex (Meilenstein M3)

Noch nicht gebaut. Bereits vorhanden:

- Outbox: Jede Änderung an `inventory_days` / `rates_days` schreibt einen Eintrag in `channex_outbox` (siehe `src/services/outbox.ts`).
- Webhook-Endpoint `POST /api/webhooks/channex` mit HMAC-Prüfung (`signature.ts`).

Zu bauen (SPEC 7): `client.ts` (REST mit `user-api-key`), Worker `channex-outbox` (Bündeln, Token-Bucket 10/min pro Property und Art, Backoff),
Worker `channex-feed` (Feed lesen, Revisionen nach SPEC 5.6 verarbeiten, nur nach Erfolg acken), Admin-Aktion „Channex verbinden“.
