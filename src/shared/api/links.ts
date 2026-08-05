import { apiFetch } from "./http";

export type PublicLink = {
  id: string;
  title: string;
  url: string;
  iconKey?: string | null;
  colorKey?: string | null;
  color?: string | null;
  variant?: "default" | "filled" | "pill" | string | null;
  order: number;
  isActive?: boolean;
};

export function getTenantLinks(tenantSlug: string) {
  return apiFetch<PublicLink[]>(`/api/v1/tenants/${tenantSlug}/links`);
}

export function registerTenantLinkClick(tenantSlug: string, linkId: string, payload: { visitorId: string; referer: string }) {
  return apiFetch<void>(`/api/v1/tenants/${tenantSlug}/links/${linkId}/click`, {
    method: "POST",
    body: JSON.stringify(payload),
    keepalive: true,
  });
}
