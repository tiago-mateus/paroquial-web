import type { PublicChurch } from "../../shared/api/churches";

export type MockChurch = PublicChurch & { tenantSlug: string };

export const churches: MockChurch[] = [
  {
    id: "church-sj-matriz",
    tenantId: "00000000-0000-0000-0000-000000000101",
    tenantSlug: "sao-jose",
    nome: "Igreja Matriz São José",
    endereco: "Rua Exemplo, 123 · Centro",
    latitude: -23.55052,
    longitude: -46.633308,
    urlImg: "",
    telefone: "(11) 99999-9999",
    tipo: "matriz",
  },
  {
    id: "church-sj-fatima",
    tenantId: "00000000-0000-0000-0000-000000000101",
    tenantSlug: "sao-jose",
    nome: "Capela Nossa Senhora de Fátima",
    endereco: "Avenida das Palmeiras, 48 · Ponta da Serra",
    latitude: -23.5587,
    longitude: -46.6424,
    urlImg: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=500&q=80",
    telefone: null,
    tipo: "capela",
  },
  {
    id: "church-sj-santissimo",
    tenantId: "00000000-0000-0000-0000-000000000101",
    tenantSlug: "sao-jose",
    nome: "Capela do Santíssimo",
    endereco: "Estrada Municipal, km 4",
    latitude: -23.5434,
    longitude: -46.6215,
    urlImg: "",
    telefone: "(11) 3333-2211",
    tipo: "capela",
  },
  {
    id: "church-sj-esperanca",
    tenantId: "00000000-0000-0000-0000-000000000101",
    tenantSlug: "sao-jose",
    nome: "Comunidade Nossa Senhora da Esperança",
    endereco: "",
    latitude: 0,
    longitude: 0,
    urlImg: "",
    telefone: null,
    tipo: "comunidade",
  },
];

export const churchAccessByTenant: Record<string, "premium" | "blocked"> = {
  "sao-jose": "premium",
  "nossa-senhora": "blocked",
  "sem-igrejas": "premium",
};
