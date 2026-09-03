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

export type UpsertLinkRequest = Omit<PublicLink, "id">;

export function getAdminTenantLinks(tenantSlug: string) {
  return apiFetch<PublicLink[]>(`/api/v1/admin/tenants/${tenantSlug}/links`);
}

export function createTenantLink(tenantSlug: string, input: UpsertLinkRequest) {
  return apiFetch<PublicLink>(`/api/v1/admin/tenants/${tenantSlug}/links`, { method: "POST", body: JSON.stringify(input) });
}

export function updateTenantLink(tenantSlug: string, linkId: string, input: UpsertLinkRequest) {
  return apiFetch<PublicLink>(`/api/v1/admin/tenants/${tenantSlug}/links/${linkId}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deleteTenantLink(tenantSlug: string, linkId: string) {
  return apiFetch<void>(`/api/v1/admin/tenants/${tenantSlug}/links/${linkId}`, { method: "DELETE" });
}

export function registerTenantLinkClick(tenantSlug: string, linkId: string, payload: { visitorId: string; referer: string }) {
  return apiFetch<void>(`/api/v1/tenants/${tenantSlug}/links/${linkId}/click`, {
    method: "POST",
    body: JSON.stringify(payload),
    keepalive: true,
  });
}
