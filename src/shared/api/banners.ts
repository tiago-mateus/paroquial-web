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
