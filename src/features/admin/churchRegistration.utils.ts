import type { UpsertChurchRequest } from "../../shared/api/churches";

export function churchRegistrationError(form: UpsertChurchRequest) {
  if (!form.nome.trim()) return "Informe o nome da igreja para cadastrar.";
  if (form.urlImg.trim()) {
    try { if (!["http:", "https:"].includes(new URL(form.urlImg.trim()).protocol)) throw new Error(); }
    catch { return "Use um link de foto que comece com http:// ou https://."; }
  }
  return undefined;
}
