import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
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

it.each([
  ["VITE_PAROQUIAL_API_CHURCHES", "churches", "banners"],
  ["VITE_PAROQUIAL_API_HIGHLIGHTS", "banners", "churches"],
])("enables %s independently for the configured parish", async (flag, enabled, disabled) => {
  vi.stubEnv("VITE_PAROQUIAL_API_TENANT", "sao-jose");
  vi.stubEnv("PAROQUIAL_API_ORIGIN", "https://api.example.test");
  vi.stubEnv("VITE_PAROQUIAL_API_CHURCHES", "false");
  vi.stubEnv("VITE_PAROQUIAL_API_HIGHLIGHTS", "false");
  vi.stubEnv(flag, "true");
  const { config } = await import("../../../vercel");
  const paths = config.rewrites.map(route => route.source);
  expect(paths).toContain(`/api/v1/tenants/sao-jose/${enabled}`);
  expect(paths).toContain(`/api/v1/admin/tenants/sao-jose/${enabled}`);
  expect(paths).not.toContain(`/api/v1/tenants/sao-jose/${disabled}`);
  expect(paths).not.toContain(`/api/v1/tenants/outra-paroquia/${enabled}`);
  expect(paths.includes("/api/v1/admin/tenants/sao-jose/banners/order")).toBe(enabled === "banners");
});

it("saves the new highlight order in one request when the area is integrated", async () => {
  vi.stubEnv("VITE_LAUNCH_MODE", "true");
  vi.stubEnv("VITE_PAROQUIAL_API_TENANT", "sao-jose");
  vi.stubEnv("VITE_PAROQUIAL_API_HIGHLIGHTS", "true");
  const fetch = vi.fn(async () => Response.json([]));
  vi.stubGlobal("fetch", fetch);
  const { reorderTenantBanners } = await import("./banners");
  await reorderTenantBanners("sao-jose", [
    { id: "second", titulo: "Segundo" },
    { id: "first", titulo: "Primeiro" },
  ]);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledWith("/api/v1/admin/tenants/sao-jose/banners/order", expect.objectContaining({
    method: "PUT",
    body: JSON.stringify({ ids: ["second", "first"] }),
  }));
});
