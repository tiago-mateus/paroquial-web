import { apiFetch } from "./http";

export type HomeHeaderConfig = {
  imageUrl?: string | null;
  imageOpacity?: number | null;
  gradientFrom?: string | null;
  gradientTo?: string | null;
};

export type HomeActionsConfig = {
  confissoes?: {
    label?: string | null;
    subtitle?: string | null;
    href?: string | null;
  } | null;
  secretaria?: {
    label?: string | null;
    subtitle?: string | null;
    href?: string | null;
  } | null;
};

export type ConfessionScheduleItem = {
  dayLabel?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  contato?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  homeHeader?: HomeHeaderConfig | null;
  homeActions?: HomeActionsConfig | null;
  confessionSchedule?: ConfessionScheduleItem[] | null;
};

export function getTenant(tenantSlug: string) {
  return apiFetch<Tenant>(`/api/v1/tenants/${tenantSlug}`);
}
