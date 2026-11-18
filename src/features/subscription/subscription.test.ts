import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "../../mocks/handlers";
import { resetDemo } from "../../mocks/onboardingStore";
import { apiFetch } from "../../shared/api/http";
import { getSession } from "../auth/auth.api";
import { getTenant } from "../../shared/api/tenants";
import { createCheckout, getOnboarding, paymentDestination, registerAccount, updateRegistration, verifyEmail } from "./subscription.api";

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
beforeEach(resetDemo);
afterEach(() => { server.resetHandlers(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
const input = { name: "Responsável de teste", email: "cadastro@example.test", password: "senha-de-teste-123", planId: "premium" as const, termsVersion: "demo-2026-10", acceptedTerms: true as const };
const parish = { name: "Paróquia de Teste", city: "Fortaleza", state: "CE", slug: "paroquia-teste-contratacao" };
const checkout = () => createCheckout("demo-premium-v1");

describe("Contratação — contrato e demonstração", () => {
  it("reinicia um teste concluído e permite reutilizar os dados sem apagar as paróquias de referência", async () => {
    vi.stubEnv("DEV", true); vi.stubEnv("VITE_ENABLE_MOCKS", "true");
    await registerAccount(input); await verifyEmail("123456"); await updateRegistration({ parish }); await checkout();
    await apiFetch("/api/v1/__demo/payment", { method: "POST", body: JSON.stringify({ result: "paid" }) });
    const now = Date.now(); vi.spyOn(Date, "now").mockReturnValue(now + 2000);
    expect((await getOnboarding()).status).toBe("active");
    await apiFetch("/api/v1/__demo/reset", { method: "POST" });
    expect((await getOnboarding()).status).toBe("account");
    expect(localStorage.getItem("paroquial-demo-onboarding-v1")).toBeNull();
    await expect(getTenant(parish.slug)).rejects.toMatchObject({ code: "TENANT_NOT_FOUND" });
    expect((await getTenant("sao-jose")).slug).toBe("sao-jose");
    await registerAccount(input); await verifyEmail("123456");
    expect((await updateRegistration({ parish })).registration?.parish?.slug).toBe(parish.slug);
  });
  it("cadastra em HTTP da rede local sem depender de crypto.randomUUID", async () => {
    vi.spyOn(crypto, "randomUUID").mockImplementation(() => { throw new Error("API indisponível nesta origem HTTP"); });
    const state = await registerAccount(input);
    expect(state.status).toBe("verify_email");
    expect(state.registration?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
  it("retoma os dados e mantém o admin indisponível antes da confirmação real do estado", async () => {
    await registerAccount(input);
    expect((await getSession()).adminTenants).toHaveLength(0);
    await expect(updateRegistration({ parish })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await verifyEmail("123456");
    await updateRegistration({ parish });
    const state = await getOnboarding();
    expect(state.registration?.parish).toEqual(parish);
    expect(state.registration?.planId).toBe("premium");
    expect((await getSession()).onboardingRequired).toBe(true);
    expect(localStorage.getItem("paroquial-demo-onboarding-v1")).not.toContain(input.password);
  });

  it("rejeita código inválido e endereço já utilizado", async () => {
    await registerAccount(input);
    await expect(verifyEmail("000000")).rejects.toMatchObject({ code: "INVALID_CODE" });
    await verifyEmail("123456");
    await expect(updateRegistration({ parish: { ...parish, slug: "sao-jose" } })).rejects.toMatchObject({ code: "SLUG_TAKEN" });
  });

  it("não transforma pagamento pendente em acesso nem permite alterar a compra em andamento", async () => {
    vi.stubEnv("DEV", true); vi.stubEnv("VITE_ENABLE_MOCKS", "true");
    await registerAccount(input); await verifyEmail("123456"); await updateRegistration({ parish });
    await expect(createCheckout("outdated-price")).rejects.toMatchObject({ code: "PRICE_CHANGED" });
    const firstCheckout = await checkout();
    expect(await checkout()).toBe(firstCheckout);
    await apiFetch("/api/v1/__demo/payment", { method: "POST", body: JSON.stringify({ result: "pending" }) });
    expect((await getOnboarding()).status).toBe("payment_pending");
    expect((await getSession()).adminTenants).toHaveLength(0);
    await expect(checkout()).rejects.toMatchObject({ code: "PAYMENT_PENDING" });
    await expect(updateRegistration({ planId: "basic" })).rejects.toMatchObject({ code: "PAYMENT_PENDING" });
  });

  it("prepara uma única paróquia e concede somente o vínculo dessa contratação", async () => {
    vi.stubEnv("DEV", true); vi.stubEnv("VITE_ENABLE_MOCKS", "true");
    await registerAccount(input); await verifyEmail("123456"); await updateRegistration({ parish }); await checkout();
    await apiFetch("/api/v1/__demo/payment", { method: "POST", body: JSON.stringify({ result: "paid" }) });
    expect((await getOnboarding()).status).toBe("provisioning");
    const now = Date.now(); vi.spyOn(Date, "now").mockReturnValue(now + 2000);
    expect((await getOnboarding()).tenantSlug).toBe(parish.slug);
    const session = await getSession();
    expect(session.adminTenants.map((tenant) => tenant.slug)).toEqual([parish.slug]);
    expect((await getOnboarding()).status).toBe("active");
    await expect(checkout()).rejects.toMatchObject({ code: "ALREADY_ACTIVE" });
  });
});

describe("Destino do pagamento", () => {
  it("aceita apenas hosts HTTPS exatos da integração de pagamento", () => {
    vi.stubEnv("DEV", false);
    expect(paymentDestination("https://checkout.stripe.com/c/pay/test")).toBe("https://checkout.stripe.com/c/pay/test");
    for (const value of ["javascript:alert(1)", "https://checkout.stripe.com.evil.test/pay", "http://checkout.stripe.com/pay", "https://evil.test/pay", "https://user:pass@checkout.stripe.com/pay", "/__demo/pagamento"]) {
      expect(() => paymentDestination(value)).toThrow();
    }
  });
});
