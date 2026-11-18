import { http, HttpResponse } from "msw";
import { z } from "zod";
import { parishSchema, planIdSchema, registrationInputSchema } from "../../features/subscription/subscription.api";
import { demoOnboarding, readDemo, resetDemo, saveDemo } from "../onboardingStore";
import { baseUrl, createMockId } from "../utils";
import { tenants } from "../data";
import { plans, type PlanId } from "../../features/marketing/offer";

const failure = (code: string, status = 400) => HttpResponse.json({ code, message: code }, { status });
const path = `${baseUrl}/api/v1`;
const reserved = new Set(["assinar", "assinatura", "login", "termos", "privacidade", "recuperar-senha", "redefinir-senha", "__demo", "api", "admin"]);
const price = (id: PlanId) => ({ amount: Math.round(plans.find((plan) => plan.id === id)!.monthly * 100), currency: "BRL" as const, interval: "month" as const, version: `demo-${id}-v1` });
export const onboardingHandlers = [
  http.post(`${path}/__demo/reset`, () => { resetDemo(); return new HttpResponse(null, { status: 204 }); }),
  http.get(`${path}/onboarding`, () => HttpResponse.json(demoOnboarding())),
  http.get(`${path}/legal/:kind`, ({ params }) => HttpResponse.json({
    title: params.kind === "terms" ? "Termos de uso" : "Política de privacidade",
    version: "demo-2026-10",
    content: "DOCUMENTO DE DEMONSTRAÇÃO — não é um contrato para contratação real.\n\nEste ambiente serve para testar o cadastro e a assinatura do Paroquial. Use dados fictícios. Nenhum pagamento é cobrado e nenhum e-mail é enviado.\n\nNa demonstração, os dados do cadastro ficam no navegador para permitir retomar o fluxo. Não informe dados pessoais reais, senhas usadas em outros serviços ou dados de cartão.\n\nA proposta de assinatura é mensal, com renovação automática e cancelamento ao final do período já pago. Antes de uma contratação real, o Paroquial deverá disponibilizar seus documentos e condições comerciais definitivos.",
  })),
  http.post(`${path}/onboarding/register`, async ({ request }) => {
    const input = registrationInputSchema.safeParse(await request.json());
    if (!input.success) return failure("VALIDATION_ERROR");
    const current = readDemo();
    if (current.user?.email.toLowerCase() === input.data.email.toLowerCase() || input.data.email.toLowerCase() === "admin@paroquial.local") return failure("EMAIL_EXISTS", 409);
    saveDemo({ status: "verify_email", user: { name: input.data.name, email: input.data.email, emailVerified: false }, registration: { id: createMockId(), planId: input.data.planId, parish: null, price: price(input.data.planId) }, loggedIn: true, demo: true });
    return HttpResponse.json(demoOnboarding(), { status: 201 });
  }),
  http.post(`${path}/onboarding/start`, async ({ request }) => {
    const state = readDemo();
    if (!state.loggedIn || !state.user?.emailVerified) return failure("UNAUTHORIZED", 401);
    if (state.status === "active") return failure("ALREADY_ACTIVE", 409);
    const input = z.object({ planId: planIdSchema }).safeParse(await request.json());
    if (!input.success) return failure("VALIDATION_ERROR");
    saveDemo({ ...state, status: "parish", registration: state.registration ?? { id: createMockId(), planId: input.data.planId, parish: null, price: price(input.data.planId) } });
    return HttpResponse.json(demoOnboarding());
  }),
  http.post(`${path}/onboarding/verify-email`, async ({ request }) => {
    const state = readDemo();
    if (!state.loggedIn || !state.user || state.status !== "verify_email") return failure("UNAUTHORIZED", 401);
    const input = await request.json() as { code?: string };
    if (input.code !== "123456") return failure("INVALID_CODE");
    saveDemo({ ...state, status: "parish", user: { ...state.user, emailVerified: true } });
    return HttpResponse.json(demoOnboarding());
  }),
  http.post(`${path}/onboarding/resend-email`, () => readDemo().loggedIn ? new HttpResponse(null, { status: 204 }) : failure("UNAUTHORIZED", 401)),
  http.patch(`${path}/onboarding/email`, async ({ request }) => {
    const state = readDemo();
    if (!state.loggedIn || !state.user || state.status !== "verify_email") return failure("UNAUTHORIZED", 401);
    const input = z.object({ email: z.string().trim().email() }).safeParse(await request.json());
    if (!input.success) return failure("VALIDATION_ERROR");
    if (input.data.email.toLowerCase() === "admin@paroquial.local") return failure("EMAIL_EXISTS", 409);
    saveDemo({ ...state, user: { ...state.user, email: input.data.email } });
    return HttpResponse.json(demoOnboarding());
  }),
  http.patch(`${path}/onboarding`, async ({ request }) => {
    const state = readDemo();
    if (!state.loggedIn || !state.user?.emailVerified || !state.registration) return failure("UNAUTHORIZED", 401);
    if (state.status === "active") return failure("ALREADY_ACTIVE", 409);
    if (["payment_pending", "provisioning"].includes(state.status)) return failure("PAYMENT_PENDING", 409);
    const input = z.object({ planId: planIdSchema.optional(), parish: parishSchema.optional() }).safeParse(await request.json());
    if (!input.success) return failure("VALIDATION_ERROR");
    if (input.data.parish && (reserved.has(input.data.parish.slug) || tenants.some((tenant) => tenant.slug === input.data.parish?.slug))) return failure("SLUG_TAKEN", 409);
    const registration = { ...state.registration, ...input.data, price: price(input.data.planId ?? state.registration.planId) };
    saveDemo({ ...state, registration, status: registration.parish ? "review" : "parish", checkoutId: undefined });
    return HttpResponse.json(demoOnboarding());
  }),
  http.post(`${path}/onboarding/checkout`, async ({ request }) => {
    const state = readDemo();
    if (!state.loggedIn || !state.user?.emailVerified || !state.registration?.parish) return failure("UNAUTHORIZED", 401);
    if (state.status === "active") return failure("ALREADY_ACTIVE", 409);
    if (["payment_pending", "provisioning"].includes(state.status)) return failure("PAYMENT_PENDING", 409);
    const input = await request.json() as { quoteVersion?: string };
    if (input.quoteVersion !== state.registration.price.version) return failure("PRICE_CHANGED", 409);
    const checkoutId = state.checkoutId ?? createMockId();
    saveDemo({ ...state, checkoutId });
    return HttpResponse.json({ url: `/__demo/pagamento?session=${checkoutId}` });
  }),
  // This simulator is registered only by the development MSW worker.
  http.post(`${path}/__demo/payment`, async ({ request }) => {
    const state = readDemo();
    if (!state.loggedIn || !state.checkoutId || !state.registration) return failure("UNAUTHORIZED", 401);
    const input = z.object({ result: z.enum(["paid", "pending", "failed", "expired", "cancel_at_period_end"]) }).safeParse(await request.json());
    if (!input.success) return failure("VALIDATION_ERROR");
    if (input.data.result === "cancel_at_period_end") {
      if (state.status !== "active") return failure("UNAUTHORIZED", 403);
      saveDemo({ ...state, cancelAtPeriodEnd: true });
    } else if (state.status !== "active" && state.status !== "provisioning") {
      saveDemo({ ...state, status: input.data.result === "paid" ? "provisioning" : input.data.result === "pending" ? "payment_pending" : input.data.result === "failed" ? "payment_failed" : "checkout_expired", provisionAt: input.data.result === "paid" ? Date.now() + 1200 : undefined });
    }
    return HttpResponse.json(demoOnboarding());
  }),
  http.get(`${path}/admin/tenants/:slug/subscription`, ({ params }) => {
    const state = readDemo();
    const existing = tenants.some((tenant) => tenant.slug === params.slug);
    if (!existing || (state.loggedIn && state.registration && (state.status !== "active" || state.tenantSlug !== params.slug))) return failure("UNAUTHORIZED", 403);
    const end = new Date(); end.setMonth(end.getMonth() + 1);
    return HttpResponse.json({ planId: state.registration?.planId ?? "premium", price: state.registration?.price ?? price("premium"), status: "active", currentPeriodEnd: end.toISOString(), cancelAtPeriodEnd: state.cancelAtPeriodEnd ?? false, canManage: true, demo: true });
  }),
  http.post(`${path}/admin/tenants/:slug/subscription/portal`, ({ params }) => {
    const state = readDemo();
    if (!state.loggedIn || state.status !== "active" || state.tenantSlug !== params.slug) return failure("UNAUTHORIZED", 403);
    return HttpResponse.json({ url: "/__demo/pagamento?portal=1" });
  }),
  http.post(`${path}/auth/password/forgot`, () => new HttpResponse(null, { status: 204 })),
  http.post(`${path}/auth/password/reset`, async ({ request }) => {
    const input = z.object({ token: z.literal("demo-reset"), password: z.string().min(10) }).safeParse(await request.json());
    return input.success ? new HttpResponse(null, { status: 204 }) : failure("INVALID_CODE");
  }),
];
