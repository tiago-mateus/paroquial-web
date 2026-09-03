import { apiFetch } from "./http";

export type PublicHomeBanner = {
  id: string;
  tipo?: string;
  titulo: string;
  mensagem?: string | null;
  link?: string | null;
  bgImg?: string | null;
  bgColor?: string | null;
  order?: number | null;
};

export function getTenantBanners(tenantSlug: string) {
  return apiFetch<PublicHomeBanner[]>(`/api/v1/tenants/${tenantSlug}/banners`);
}

export type UpsertBannerRequest = Omit<PublicHomeBanner, "id">;

export function createTenantBanner(tenantSlug: string, input: UpsertBannerRequest) {
  return apiFetch<PublicHomeBanner>(`/api/v1/admin/tenants/${tenantSlug}/banners`, { method: "POST", body: JSON.stringify(input) });
}

export function updateTenantBanner(tenantSlug: string, bannerId: string, input: UpsertBannerRequest) {
  return apiFetch<PublicHomeBanner>(`/api/v1/admin/tenants/${tenantSlug}/banners/${bannerId}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deleteTenantBanner(tenantSlug: string, bannerId: string) {
  return apiFetch<void>(`/api/v1/admin/tenants/${tenantSlug}/banners/${bannerId}`, { method: "DELETE" });
}
