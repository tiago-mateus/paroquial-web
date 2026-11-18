import { describe, expect, it } from "vitest";
import { contrast, defaultTheme, parseTheme, themePresets, themeTokens } from "./palette";

describe("parish theme", () => {
  it.each(themePresets)("maintains legibility in $name", ({ theme }) => {
    expect(parseTheme(theme)).toEqual(theme);
    const tokens = themeTokens(theme);
    for (const [text, background] of [
      ["--color-ink", "--color-canvas"],
      ["--color-muted", "--color-surface"],
      ["--color-accent-ink", "--color-accent"],
      ["--color-primary", "--color-selection"],
    ]) expect(contrast(tokens[text], tokens[background])).toBeGreaterThanOrEqual(4.5);
  });

  it("rejects colors that break the interface or fail contrast", () => {
    expect(parseTheme({ ...defaultTheme, primary: "url(https://example.org)" })).toBeNull();
    expect(parseTheme({ ...defaultTheme, primary: "#EEEEEE" })).toBeNull();
    expect(parseTheme({ ...defaultTheme, canvas: "#222222" })).toBeNull();
    expect(parseTheme({ ...defaultTheme, accent: "#777777" })).not.toBeNull();
  });
});
