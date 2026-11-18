import { launchMode } from "../../shared/launchMode";
import { z } from "zod";
import { apiFetch } from "../../shared/api/http";

export const planIdSchema = z.enum(["basic", "premium", "pro"]);
export const parishSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome da paróquia."),
  city: z.string().trim().min(2, "Informe a cidade."),
  state: z.string().regex(/^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/, "Selecione o estado."),
  slug: z.string().min(3, "Use pelo menos 3 caracteres no endereço.").max(64).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use letras minúsculas, números e hífens."),
});
export type ParishDraft = z.infer<typeof parishSchema>;
export const priceSchema = z.object({ amount: z.number().int().positive(), currency: z.literal("BRL"), interval: z.literal("month"), version: z.string().min(1) });
export const registrationInputSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome."),
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().min(10, "Use pelo menos 10 caracteres."),
  planId: planIdSchema,
  termsVersion: z.string().min(1),
  acceptedTerms: z.literal(true),
});
export const onboardingSchema = z.object({
  status: z.enum(["account", "verify_email", "parish", "review", "payment_pending", "payment_failed", "checkout_expired", "provisioning", "active"]),
  user: z.object({ name: z.string(), email: z.string(), emailVerified: z.boolean() }).nullable(),
  registration: z.object({ id: z.string(), planId: planIdSchema, parish: parishSchema.nullable(), price: priceSchema }).nullable(),
  tenantSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  demo: z.boolean().optional(),
});
export type Onboarding = z.infer<typeof onboardingSchema>;
export const subscriptionSchema = z.object({
  planId: planIdSchema,
  price: priceSchema,
  status: z.enum(["active", "past_due", "canceled"]),
  currentPeriodEnd: z.string().datetime(),
  cancelAtPeriodEnd: z.boolean(),
  canManage: z.boolean(),
  demo: z.boolean().optional(),
});
export type Subscription = z.infer<typeof subscriptionSchema>;
export const legalSchema = z.object({ title: z.string(), version: z.string(), content: z.string() });
const json = (body: unknown) => JSON.stringify(body);
export const getOnboarding = () => apiFetch<unknown>("/api/v1/onboarding").then(onboardingSchema.parse);
export const registerAccount = (input: z.infer<typeof registrationInputSchema>) => apiFetch<unknown>("/api/v1/onboarding/register", { method: "POST", body: json(registrationInputSchema.parse(input)) }).then(onboardingSchema.parse);
export const startRegistration = (planId: z.infer<typeof planIdSchema>) => apiFetch<unknown>("/api/v1/onboarding/start", { method: "POST", body: json({ planId }) }).then(onboardingSchema.parse);
export const updateRegistration = (input: { planId?: z.infer<typeof planIdSchema>; parish?: ParishDraft }) => apiFetch<unknown>("/api/v1/onboarding", { method: "PATCH", body: json(input) }).then(onboardingSchema.parse);
export const verifyEmail = (code: string) => apiFetch<unknown>("/api/v1/onboarding/verify-email", { method: "POST", body: json({ code }) }).then(onboardingSchema.parse);
export const resendVerification = () => apiFetch<void>("/api/v1/onboarding/resend-email", { method: "POST" });
export const changeRegistrationEmail = (email: string) => apiFetch<unknown>("/api/v1/onboarding/email", { method: "PATCH", body: json({ email }) }).then(onboardingSchema.parse);
export const getLegal = (kind: "terms" | "privacy") => launchMode
  ? Promise.resolve({
      title: kind === "terms" ? "Condições da solicitação" : "Dados da solicitação",
      version: "launch",
      content: kind === "terms"
        ? "O formulário registra seu interesse em um plano. O envio ao WhatsApp inicia o atendimento. A ativação, o pagamento e as condições da assinatura são combinados na conversa."
        : "As informações preenchidas ficam na página até você abrir o WhatsApp. Ao enviar a mensagem, o nome, o e-mail, o telefone e os dados da paróquia são compartilhados com o atendimento do Paroquial para responder à solicitação.",
    })
  : apiFetch<unknown>(`/api/v1/legal/${kind}`).then(legalSchema.parse);

export function paymentDestination(url: string) {
  const destination = new URL(url, window.location.origin);
  const demo = import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS === "true";
  if (demo && destination.origin === window.location.origin && destination.pathname === "/__demo/pagamento") return destination.href;
  if (destination.protocol !== "https:" || destination.username || destination.password || !["checkout.stripe.com", "billing.stripe.com"].includes(destination.hostname)) {
    throw new Error("Destino de pagamento inválido.");
  }
  return destination.href;
}
export async function createCheckout(quoteVersion: string) {
  const result = await apiFetch<unknown>("/api/v1/onboarding/checkout", { method: "POST", body: json({ quoteVersion }) });
  return paymentDestination(z.object({ url: z.string() }).parse(result).url);
}
export const getSubscription = (slug: string) => apiFetch<unknown>(`/api/v1/admin/tenants/${slug}/subscription`).then(subscriptionSchema.parse);
export async function createBillingPortal(slug: string) {
  const result = await apiFetch<unknown>(`/api/v1/admin/tenants/${slug}/subscription/portal`, { method: "POST" });
  return paymentDestination(z.object({ url: z.string() }).parse(result).url);
}
export function subscriptionError(error: unknown) {
  if (error instanceof TypeError && /fetch|network|load failed/i.test(error.message)) {
    return "Não foi possível conectar. Confira sua conexão e tente novamente. Suas respostas foram mantidas.";
  }
  if (error && typeof error === "object" && "code" in error) {
    const messages: Record<string, string> = {
      EMAIL_EXISTS: "Este e-mail já possui uma conta. Entre para continuar a contratação.",
      INVALID_CODE: "Código inválido ou expirado. Confira o e-mail ou solicite outro código.",
      SLUG_TAKEN: "Este endereço já está em uso. Escolha outro para sua paróquia.",
      PAYMENT_PENDING: "Já existe um pagamento em andamento. Acompanhe a confirmação antes de tentar novamente.",
      ALREADY_ACTIVE: "Esta assinatura já está ativa. Continue para o administrativo.",
      RATE_LIMITED: "Aguarde um pouco antes de tentar novamente.",
      PRICE_CHANGED: "O valor do plano foi atualizado. Confira o novo resumo antes de continuar para o pagamento.",
      UNAUTHORIZED: "Sua sessão expirou. Entre novamente para continuar.",
    };
    if (messages[String(error.code)]) return messages[String(error.code)];
  }
  return "Não foi possível concluir agora. Seus dados foram mantidos. Tente novamente.";
}
export const ufOptions = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
export const suggestSlug = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64).replace(/-$/, "");
