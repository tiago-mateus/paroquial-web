import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useApplyParishTheme, themeQueryKey } from "./parishTheme";
import { defaultTheme, themePresets } from "./palette";

vi.mock("../launchMode", () => ({ launchMode: true }));

const token = () => document.documentElement.style.getPropertyValue("--color-primary");

function PublicPage({ tenant }: { tenant: string }) {
  useApplyParishTheme(tenant);
  return <span>Conteúdo público</span>;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("applies cached themes immediately and isolates a tenant without cache while its request is pending", async () => {
  const client = new QueryClient();
  const blue = themePresets[1].theme;
  const wine = themePresets[2].theme;
  client.setQueryData(themeQueryKey("azul"), { storage: "shared", theme: blue });
  let resolve!: (response: Response) => void;
  const fetchTheme = vi.fn(() => new Promise<Response>(done => { resolve = done; }));
  vi.stubGlobal("fetch", fetchTheme);
  const page = (tenant: string) => <QueryClientProvider client={client}><PublicPage tenant={tenant} /></QueryClientProvider>;
  const view = render(page("azul"));
  expect(token()).toBe(blue.primary);
  expect(fetchTheme).not.toHaveBeenCalled();
  view.rerender(page("vinho"));
  expect(token()).toBe("#525252");
  resolve(Response.json({ storage: "shared", theme: wine }));
  await waitFor(() => expect(token()).toBe(wine.primary));
  view.rerender(page("azul"));
  expect(token()).toBe(blue.primary);
  view.unmount();
  expect(token()).toBe("");
});

it("falls back to the institutional theme only after a cold request fails", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 503 })));
  render(<QueryClientProvider client={new QueryClient()}><PublicPage tenant="falha" /></QueryClientProvider>);
  expect(token()).toBe("#525252");
  await waitFor(() => expect(token()).toBe(defaultTheme.primary));
});
