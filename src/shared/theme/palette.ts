import { z } from "zod";

const hexColor = z.string().trim().regex(/^#[0-9a-f]{6}$/i).transform(value => value.toUpperCase());
export const themeSchema = z.object({ primary: hexColor, accent: hexColor, canvas: hexColor }).strict();
export type ParishTheme = z.infer<typeof themeSchema>;

export const defaultTheme: ParishTheme = { primary: "#17654D", accent: "#F1CA67", canvas: "#F7F7EF" };
export const themePresets = [
  { name: "Verde paroquial", theme: defaultTheme },
  { name: "Azul profundo", theme: { primary: "#264D78", accent: "#CADBEC", canvas: "#F2F5F9" } },
  { name: "Vinho litúrgico", theme: { primary: "#713749", accent: "#EBC8AD", canvas: "#FAF3F3" } },
  { name: "Terracota", theme: { primary: "#79472D", accent: "#EEC994", canvas: "#FBF4E9" } },
] as const;
export const themeFields = [
  { key: "primary", label: "Cor principal", description: "Botões, links e foco" },
  { key: "accent", label: "Cor de destaque", description: "Seleções e chamadas" },
  { key: "canvas", label: "Cor de fundo", description: "Fundo das páginas" },
] as const satisfies readonly { key: keyof ParishTheme; label: string; description: string }[];

function channels(hex: string) {
  return [1, 3, 5].map(offset => Number.parseInt(hex.slice(offset, offset + 2), 16));
}

function mix(from: string, to: string, ratio: number) {
  const target = channels(to);
  return "#" + channels(from).map((value, index) =>
    Math.round(value + (target[index] - value) * ratio).toString(16).padStart(2, "0"),
  ).join("");
}

export function contrast(a: string, b: string) {
  const luminance = (hex: string) => channels(hex).reduce((sum, value, index) => {
    const srgb = value / 255;
    const linear = srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
    return sum + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);
  const values = [luminance(a), luminance(b)];
  return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
}

export function sameTheme(a: ParishTheme, b: ParishTheme) {
  return themeFields.every(({ key }) => a[key] === b[key]);
}

export function themeTokens(theme: ParishTheme): Record<string, string> {
  if (sameTheme(theme, defaultTheme)) return {
    "--color-primary": "#17654D", "--color-primary-hover": "#104B39", "--color-focus": "#17654D",
    "--color-accent": "#F1CA67", "--color-accent-ink": "#514019", "--color-canvas": "#F7F7EF",
    "--color-surface": "#FFFEF9", "--color-ink": "#163B31", "--color-muted": "#53685F",
    "--color-line": "#DBE3D9", "--color-control-border": "#7D9185", "--color-selection": "#E4EDDD",
  };
  const { primary, accent, canvas } = theme;
  const ink = mix(primary, "#101010", 0.65);
  return {
    "--color-primary": primary,
    "--color-primary-hover": mix(primary, "#000000", 0.22),
    "--color-focus": primary,
    "--color-accent": accent,
    "--color-accent-ink": contrast(accent, "#000000") >= contrast(accent, "#FFFFFF") ? "#000000" : "#FFFFFF",
    "--color-canvas": canvas,
    "--color-surface": mix(canvas, "#FFFFFF", 0.78),
    "--color-ink": ink,
    "--color-muted": mix(ink, canvas, 0.32),
    "--color-line": mix(canvas, ink, 0.13),
    "--color-control-border": mix(canvas, ink, 0.49),
    "--color-selection": mix(canvas, primary, 0.09),
  };
}

export function themeErrors(theme: ParishTheme): Partial<Record<keyof ParishTheme, string>> {
  const errors: Partial<Record<keyof ParishTheme, string>> = {};
  if (contrast(theme.primary, "#FFFFFF") < 4.5) errors.primary = "Escolha uma cor mais escura para manter os botões legíveis.";
  if (contrast(theme.canvas, "#242424") < 9) errors.canvas = "Escolha um fundo mais claro para manter os textos legíveis.";
  const selection = themeTokens(theme)["--color-selection"];
  if (!errors.canvas && !errors.primary && contrast(theme.primary, selection) < 4.5) {
    errors.primary = "Escureça a cor principal para manter o contraste nas seleções.";
  }
  return errors;
}

export function parseTheme(input: unknown) {
  const result = themeSchema.safeParse(input);
  return result.success && Object.keys(themeErrors(result.data)).length === 0 ? result.data : null;
}
