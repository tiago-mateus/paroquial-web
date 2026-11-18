CREATE TABLE IF NOT EXISTS public.parish_themes (
  tenant_slug text PRIMARY KEY
    CHECK (length(tenant_slug) <= 64 AND tenant_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  primary_color text NOT NULL CHECK (primary_color ~ '^#[0-9A-F]{6}$'),
  accent_color text NOT NULL CHECK (accent_color ~ '^#[0-9A-F]{6}$'),
  canvas_color text NOT NULL CHECK (canvas_color ~ '^#[0-9A-F]{6}$'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
