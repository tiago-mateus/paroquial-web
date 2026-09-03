import { describe, expect, it } from "vitest";
import { formatBrazilianPhone, getBrazilianWhatsappHref, isValidBrazilianPhone } from "./phone";

describe("telefone brasileiro", () => {
  it("formata números locais e internacionais", () => {
    expect(formatBrazilianPhone("11999999999")).toBe("(11) 99999-9999");
    expect(formatBrazilianPhone("5511999999999")).toBe("+55 (11) 99999-9999");
  });

  it("gera o destino internacional do WhatsApp", () => {
    expect(getBrazilianWhatsappHref("(11) 99999-9999")).toBe("https://wa.me/5511999999999");
    expect(getBrazilianWhatsappHref("+55 (11) 99999-9999")).toBe("https://wa.me/5511999999999");
  });

  it("aceita vazio e rejeita números incompletos", () => {
    expect(isValidBrazilianPhone("")).toBe(true);
    expect(getBrazilianWhatsappHref("")).toBeUndefined();
    expect(isValidBrazilianPhone("11999")).toBe(false);
    expect(getBrazilianWhatsappHref("11999")).toBeUndefined();
  });
});
