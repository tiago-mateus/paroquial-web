import type { ParishTheme } from "../src/shared/theme/palette.js";

type Query = (statement: string, values: string[]) => Promise<Record<string, unknown>[]>;

export function postgresThemeStore(query: Query) {
  return {
    async read(tenant: string) {
      const [row] = await query(
        'SELECT primary_color AS "primary", accent_color AS accent, canvas_color AS canvas FROM public.parish_themes WHERE tenant_slug = $1',
        [tenant],
      );
      return row ?? null;
    },
    async write(tenant: string, theme: ParishTheme) {
      await query(
        `INSERT INTO public.parish_themes (tenant_slug, primary_color, accent_color, canvas_color)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (tenant_slug) DO UPDATE SET
           primary_color = EXCLUDED.primary_color,
           accent_color = EXCLUDED.accent_color,
           canvas_color = EXCLUDED.canvas_color,
           updated_at = now()`,
        [tenant, theme.primary, theme.accent, theme.canvas],
      );
    },
  };
}
