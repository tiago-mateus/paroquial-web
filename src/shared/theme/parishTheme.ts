import { useQuery } from "@tanstack/react-query";
import { useLayoutEffect } from "react";
import { launchMode } from "../launchMode";
import { defaultTheme, parseTheme, themeTokens, type ParishTheme } from "./palette";

export type StoredTheme = { storage: "browser" | "shared"; theme: ParishTheme };
const key = (tenant: string) => "paroquial-theme:" + tenant;
const endpoint = (tenant: string) => "/api/parish-theme?tenant=" + encodeURIComponent(tenant);
export const themeQueryKey = (tenant: string) => ["parish-theme", tenant];

function browserTheme(tenant: string): ParishTheme {
  try {
    return parseTheme(JSON.parse(localStorage.getItem(key(tenant)) ?? "null")) ?? defaultTheme;
  } catch {
    return defaultTheme;
  }
}

async function readTheme(tenant: string): Promise<StoredTheme> {
  if (!launchMode) return { storage: "browser", theme: browserTheme(tenant) };
  const response = await fetch(endpoint(tenant));
  if (!response.ok) throw new Error("Não foi possível carregar o tema.");
  const data = await response.json();
  if (data.storage === "shared") return { storage: "shared", theme: parseTheme(data.theme) ?? defaultTheme };
  if (data.storage === "browser") return { storage: "browser", theme: browserTheme(tenant) };
  throw new Error("Não foi possível identificar onde o tema é salvo.");
}

export function useParishTheme(tenant: string) {
  return useQuery({ queryKey: themeQueryKey(tenant), queryFn: () => readTheme(tenant), enabled: Boolean(tenant), staleTime: 30_000, retry: false });
}

export async function saveParishTheme(tenant: string, storage: StoredTheme["storage"], theme: ParishTheme): Promise<StoredTheme> {
  if (storage === "browser") {
    localStorage.setItem(key(tenant), JSON.stringify(theme));
    return { storage, theme };
  }
  const response = await fetch(endpoint(tenant), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(theme) });
  if (!response.ok) throw new Error("Não foi possível publicar o tema.");
  return { storage, theme };
}

export function useApplyParishTheme(tenant: string) {
  const theme = useParishTheme(tenant).data?.theme;
  useLayoutEffect(() => {
    if (!theme) return;
    const style = document.documentElement.style;
    const tokens = themeTokens(theme);
    for (const [name, value] of Object.entries(tokens)) style.setProperty(name, value);
    return () => { for (const name of Object.keys(tokens)) style.removeProperty(name); };
  }, [theme]);
}
