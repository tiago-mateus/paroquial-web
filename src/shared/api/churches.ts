import { apiFetch } from "./http";

export type PublicChurch = {
  id: string;
  tenantId: string;
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
  urlImg: string;
  telefone: string | null;
  tipo: "matriz" | "capela" | string;
};

export function getTenantChurches(tenantSlug: string) {
  return apiFetch<PublicChurch[]>(`/api/v1/tenants/${tenantSlug}/churches`);
}

export type UpsertChurchRequest = Omit<PublicChurch, "id" | "tenantId">;

export function createChurch(tenantSlug: string, input: UpsertChurchRequest) {
  return apiFetch<PublicChurch>(`/api/v1/admin/tenants/${tenantSlug}/churches`, { method: "POST", body: JSON.stringify(input) });
}

export function updateChurch(tenantSlug: string, churchId: string, input: UpsertChurchRequest) {
  return apiFetch<PublicChurch>(`/api/v1/admin/tenants/${tenantSlug}/churches/${churchId}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deleteChurch(tenantSlug: string, churchId: string) {
  return apiFetch<void>(`/api/v1/admin/tenants/${tenantSlug}/churches/${churchId}`, { method: "DELETE" });
}

export function hasValidChurchCoordinates(church: PublicChurch) {
  return Number.isFinite(church.latitude) && Number.isFinite(church.longitude) && church.latitude !== 0 && church.longitude !== 0;
}

export function getChurchDirectionsHref(church: PublicChurch) {
  const query = hasValidChurchCoordinates(church)
    ? `${church.latitude},${church.longitude}`
    : [church.nome, church.endereco].filter(Boolean).join(", ");
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
}
