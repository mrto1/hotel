-- 0003: Website-Editor (Seiten aus Bausteinen) und englische Texte für Zimmer/Tarife

CREATE TABLE site_pages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  slug         text NOT NULL,                       -- '' = Startseite, sonst z. B. 'restaurant'
  title        jsonb NOT NULL DEFAULT '{}'::jsonb,  -- {"de": "...", "en": "..."}
  nav_label    jsonb NOT NULL DEFAULT '{}'::jsonb,
  show_in_nav  boolean NOT NULL DEFAULT true,
  sort_order   integer NOT NULL DEFAULT 0,
  seo          jsonb NOT NULL DEFAULT '{}'::jsonb,  -- {"de": {"title","description"}, "en": {...}}
  blocks       jsonb NOT NULL DEFAULT '[]'::jsonb,  -- Bausteine, siehe src/domain/blocks.ts
  published    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hotel_id, slug),
  CHECK (slug = '' OR slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
CREATE INDEX ON site_pages(hotel_id, sort_order);

-- Englische Texte: {"en": {"name": "...", "description": "..."}}
ALTER TABLE room_types ADD COLUMN i18n jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE rate_plans ADD COLUMN i18n jsonb NOT NULL DEFAULT '{}'::jsonb;
