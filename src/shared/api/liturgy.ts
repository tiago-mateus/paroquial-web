import { apiFetch } from "./http";

export type LiturgicalReading = {
  referencia?: string | null;
  cor?: string | null;
  liturgia?: string | null;
};

export function getTodayLiturgy() {
  return apiFetch<LiturgicalReading>("/api/v1/liturgy/today");
}
