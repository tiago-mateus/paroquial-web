export const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
export const baseUrl = apiUrl.replace(/\/$/, "");

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
