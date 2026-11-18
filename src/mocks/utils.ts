import { launchMode } from "../shared/launchMode";

export const apiUrl = launchMode ? "" : (import.meta.env.VITE_API_URL ?? "http://localhost:8080");
export const baseUrl = apiUrl.replace(/\/$/, "");

// randomUUID is unavailable on ordinary HTTP LAN origins. getRandomValues
// remains available there, so development on a phone can still create records.
export function createMockId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function toDateString(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function validationError(fields: Record<string, string[]>) {
  return {
    code: "VALIDATION_ERROR",
    message: "Revise os campos destacados.",
    fields,
  };
}

export function tenantNotFound() {
  return {
    code: "TENANT_NOT_FOUND",
    message: "Paroquia nao encontrada.",
  };
}
