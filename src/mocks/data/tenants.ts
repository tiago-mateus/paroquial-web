import type { ConfessionScheduleItem, HomeActionsConfig, HomeHeaderConfig } from "../../shared/api/tenants";

export type MockTenant = {
  id: string;
  slug: string;
  name: string;
  contato?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  homeHeader?: HomeHeaderConfig;
  homeActions?: HomeActionsConfig;
  confessionSchedule?: ConfessionScheduleItem[];
  theme: Record<string, unknown>;
};

export const tenants: MockTenant[] = [
  {
    id: "00000000-0000-0000-0000-000000000101",
    slug: "sao-jose",
    name: "Paróquia Santo Antônio de Pádua",
    contato: "secretaria@paroquial.local",
    telefone: "(11) 99999-9999",
    endereco: "Rua Exemplo, 123",
    cidade: "Itaitinga",
    estado: "CE",
    homeHeader: {
      imageUrl:
        "https://www.anuariodoceara.com.br/wp-content/uploads/2023/07/ITAITINGA_igreja-matriz_FOTO_Oseias-Targino-822x537.jpeg",
      imageOpacity: 0.34,
      gradientFrom: "#7c2d12",
      gradientTo: "#1f2937",
    },
    homeActions: {
      confissoes: {
        label: "Confissoes",
        subtitle: "Ver horarios",
      },
      secretaria: {
        label: "Secretaria",
        subtitle: "Falar no WhatsApp",
      },
    },
    confessionSchedule: [
      { dayLabel: "Quarta a Sexta", startTime: "15:00", endTime: "17:00" },
      { dayLabel: "Sabado", startTime: "09:00", endTime: "11:00" },
    ],
    theme: { primaryColor: "#2563eb" },
  },
  {
    id: "00000000-0000-0000-0000-000000000102",
    slug: "nossa-senhora",
    name: "Paroquia Nossa Senhora",
    contato: "contato@nossasenhora.local",
    telefone: "(21) 98888-8888",
    endereco: "Avenida Central, 45",
    cidade: "Rio de Janeiro",
    estado: "RJ",
    homeHeader: {
      gradientFrom: "#0f766e",
      gradientTo: "#155e75",
      imageOpacity: 0.2,
    },
    homeActions: {
      confissoes: {
        label: "Confissoes",
        subtitle: "Atendimento semanal",
      },
      secretaria: {
        label: "Secretaria",
        subtitle: "Enviar mensagem",
      },
    },
    confessionSchedule: [{ dayLabel: "Terca e Quinta", startTime: "16:00", endTime: "18:00" }],
    theme: { primaryColor: "#0f766e" },
  },
  {
    id: "00000000-0000-0000-0000-000000000199",
    slug: "erro-links",
    name: "Paróquia de Teste",
    cidade: "Cidade de Teste",
    estado: "SP",
    homeHeader: { gradientFrom: "#334155", gradientTo: "#0f172a" },
    theme: { primaryColor: "#334155" },
  },
];

export function findTenantBySlug(tenantSlug: string) {
  return tenants.find((tenant) => tenant.slug === tenantSlug);
}

export function tenantExists(tenantSlug: string) {
  return tenants.some((tenant) => tenant.slug === tenantSlug);
}
