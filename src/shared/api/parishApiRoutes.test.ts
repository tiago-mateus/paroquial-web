import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it("preserves the SPA rewrite when no parish is enabled", async () => {
  vi.stubEnv("VITE_PAROQUIAL_API_TENANT", "");
  const { config } = await import("../../../vercel");
  expect(config.rewrites).toEqual([
    { source: "/((?!api/).*)", destination: "/index.html" },
  ]);
});

it("rewrites only the migrated routes of the configured parish", async () => {
  vi.stubEnv("VITE_PAROQUIAL_API_TENANT", "sao-jose");
  vi.stubEnv("PAROQUIAL_API_ORIGIN", "https://api.example.test/");
  const { config } = await import("../../../vercel");
  expect(config.rewrites.slice(0, -1).map(route => route.source)).toEqual([
    "/api/v1/tenants/sao-jose",
    "/api/v1/admin/tenants/sao-jose",
    "/api/v1/tenants/sao-jose/links",
    "/api/v1/tenants/sao-jose/links/:linkId/click",
    "/api/v1/admin/tenants/sao-jose/links",
    "/api/v1/admin/tenants/sao-jose/links/:linkId",
  ]);
  for (const { source, destination } of config.rewrites.slice(0, -1)) {
    expect(destination).toBe("https://api.example.test" + source);
  }
});

it("rejects activation without a valid API origin", async () => {
  vi.stubEnv("VITE_PAROQUIAL_API_TENANT", "sao-jose");
  vi.stubEnv("PAROQUIAL_API_ORIGIN", "");
  await expect(import("../../../vercel")).rejects.toThrow("PAROQUIAL_API_ORIGIN");
});
