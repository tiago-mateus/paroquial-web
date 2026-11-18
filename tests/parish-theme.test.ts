import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { get, put } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";
import endpoint from "../api/parish-theme";
import login from "../api/launch-session.js";
import { defaultTheme } from "../src/shared/theme/palette";

vi.mock("@vercel/blob", () => ({ get: vi.fn(), put: vi.fn() }));
vi.mock("@neondatabase/serverless", () => ({ neon: vi.fn() }));
const origin = "https://example.test";
const request = (method: string, tenant = "sao-jose", cookie = "", source = origin) =>
  new Request(origin + "/api/parish-theme?tenant=" + tenant, {
    method, headers: { origin: source, cookie },
    body: method === "PUT" ? JSON.stringify(defaultTheme) : undefined,
  });

beforeEach(() => { vi.stubEnv("DATABASE_URL", ""); vi.stubEnv("BLOB_READ_WRITE_TOKEN", ""); });
afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });

async function loginForTest() {
  vi.stubEnv("PAROQUIAL_ADMIN_EMAIL", "test@example.test");
  vi.stubEnv("PAROQUIAL_ADMIN_PASSWORD", "test-password");
  vi.stubEnv("PAROQUIAL_SESSION_SECRET", "test-secret-that-is-over-thirty-two-characters");
  vi.stubEnv("PAROQUIAL_ADMIN_TENANT", "sao-jose");
  const session = await login.fetch(new Request(origin + "/api/launch-session", {
    method: "POST", headers: { origin, "content-type": "application/json" },
    body: JSON.stringify({ email: "test@example.test", password: "test-password" }),
  }));
  return session.headers.get("set-cookie")!.split(";")[0];
}

describe("theme storage endpoint", () => {
  it("signals browser storage when no Blob store is configured", async () => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    expect(await (await endpoint.fetch(request("GET"))).json()).toEqual({ storage: "browser", theme: null });
    expect(get).not.toHaveBeenCalled();
  });

  it("requires a valid same-origin admin session for the parish before publishing", async () => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "test-blob-token");
    const cookie = await loginForTest();
    expect((await endpoint.fetch(request("PUT"))).status).toBe(401);
    expect((await endpoint.fetch(request("PUT", "other-parish", cookie))).status).toBe(403);
    expect((await endpoint.fetch(request("PUT", "sao-jose", cookie, "https://other.example"))).status).toBe(403);
    expect(put).not.toHaveBeenCalled();

    const result = await endpoint.fetch(request("PUT", "sao-jose", cookie));
    expect(result.status).toBe(200);
    expect(put).toHaveBeenCalledWith("parish-themes/sao-jose.json", JSON.stringify(defaultTheme), expect.objectContaining({ access: "private", allowOverwrite: true }));

    const stream = new Response(JSON.stringify(defaultTheme)).body;
    vi.mocked(get).mockResolvedValue({ statusCode: 200, stream } as Awaited<ReturnType<typeof get>>);
    expect(await (await endpoint.fetch(request("GET"))).json()).toEqual({ storage: "shared", theme: defaultTheme });
  });

  it("uses Postgres for published themes and prevents writes to another parish", async () => {
    vi.stubEnv("DATABASE_URL", "configured-for-test");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "test-blob-token");
    const query = vi.fn().mockResolvedValueOnce([defaultTheme]).mockResolvedValue([]);
    vi.mocked(neon).mockReturnValue({ query } as unknown as ReturnType<typeof neon>);
    const cookie = await loginForTest();

    expect(await (await endpoint.fetch(request("GET"))).json()).toEqual({ storage: "shared", theme: defaultTheme });
    expect(query).toHaveBeenNthCalledWith(1, expect.stringContaining("tenant_slug = $1"), ["sao-jose"]);
    expect((await endpoint.fetch(request("PUT", "other-parish", cookie))).status).toBe(403);
    expect(query).toHaveBeenCalledTimes(1);

    expect((await endpoint.fetch(request("PUT", "sao-jose", cookie))).status).toBe(200);
    expect(query).toHaveBeenNthCalledWith(2, expect.stringContaining("ON CONFLICT (tenant_slug)"), ["sao-jose", defaultTheme.primary, defaultTheme.accent, defaultTheme.canvas]);
    expect(get).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });
});
