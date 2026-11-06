-- 0002: Ergänzungen, die in schema.sql v1 fehlten (siehe QUESTIONS.md)

-- Magic-Link-Login: Einmal-Token, nur der SHA-256-Hash wird gespeichert, 15 Minuten gültig.
CREATE TABLE login_tokens (
  token_hash  text PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON login_tokens(user_id);

-- Texte und Fotos der Hotel-Website (DE/EN):
-- {"de": {"headline": "...", "intro": "..."}, "en": {...}, "photos": [{"url": "...", "alt": "..."}]}
ALTER TABLE hotels ADD COLUMN content jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Kinderalter für die Kurtaxe (Alter am Anreisetag), z. B. [4, 10]
ALTER TABLE bookings ADD COLUMN children_ages jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Sprache der Buchung (für E-Mails und Stripe Checkout)
ALTER TABLE bookings ADD COLUMN language text NOT NULL DEFAULT 'de';

-- Überbuchung (SPEC 5.6) sichtbar machen
ALTER TABLE bookings ADD COLUMN overbooked boolean NOT NULL DEFAULT false;
