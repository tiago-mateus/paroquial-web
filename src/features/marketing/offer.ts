export type PlanId = "basic" | "premium" | "pro";

export const plans: {
  id: PlanId;
  name: string;
  monthly: number;
  description: string;
  popular?: boolean;
  features: { label: string; pending?: boolean }[];
}[] = [
  {
    id: "basic",
    name: "Básico",
    monthly: 27.9,
    description: "Para começar a organizar a presença digital.",
    features: [
      { label: "Até 5 links" },
      { label: "Até 60 eventos/mês" },
      { label: "Igrejas" },
      { label: "Comunidades" },
      { label: "Site próprio" },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    monthly: 42.5,
    popular: true,
    description: "Para centralizar a organização paroquial.",
    features: [
      { label: "Links ilimitados" },
      { label: "Eventos ilimitados" },
      { label: "Exportação em PDF" },
      { label: "Gestão de igrejas" },
      { label: "Comunidades", pending: true },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 97.9,
    description: "Para paróquias que querem um portal digital completo.",
    features: [
      { label: "Tudo do Premium" },
      { label: "Site próprio" },
      { label: "Blog e notícias" },
      { label: "Galeria de fotos" },
      { label: "Vídeos por incorporação" },
    ],
  },
];

export const money = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const offer = {
  subscriptionUrl:
    import.meta.env.VITE_SUBSCRIPTION_URL?.trim() ||
    "https://wa.me/5585992180534",
};

export function subscriptionHref(
  period: "monthly" | "annual" = "monthly",
  planId?: PlanId,
  intent: "subscription" | "demo" = "subscription",
) {
  try {
    const url = new URL(offer.subscriptionUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
    const plan = plans.find((item) => item.id === planId);
    if (
      ["wa.me", "api.whatsapp.com", "web.whatsapp.com"].includes(url.hostname)
    ) {
      const request =
        intent === "demo"
          ? "Quero conhecer uma demonstração do Paroquial."
          : "Quero conhecer as condições de assinatura do Paroquial.";
      const interest = plan
        ? ` Tenho interesse no plano ${plan.name}, por ${money(plan.monthly)}/mês.`
        : "";
      const existing = url.searchParams.get("text")?.trim();
      url.searchParams.set(
        "text",
        [existing, request + interest].filter(Boolean).join("\n"),
      );
    } else {
      url.searchParams.set("period", period);
      if (planId) url.searchParams.set("plan", planId);
      if (intent === "demo") url.searchParams.set("intent", "demo");
    }
    return url.toString();
  } catch {
    return undefined;
  }
}
