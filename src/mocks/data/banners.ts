import type { PublicHomeBanner } from "../../shared/api/banners";

export type MockBanner = PublicHomeBanner & {
  tenantSlug: string;
};

export const banners: MockBanner[] = [
  {
    id: "banner-sj-1",
    tenantSlug: "sao-jose",
    tipo: "aviso",
    titulo: "Festa do Padroeiro",
    mensagem: "Programacao especial durante toda a semana.",
    link: "https://paroquial.local",
    bgColor: "linear-gradient(135deg, #be123c, #7f1d1d)",
    order: 0,
  },
  {
    id: "banner-sj-2",
    tenantSlug: "sao-jose",
    tipo: "aviso",
    titulo: "Campanha do Agasalho",
    mensagem: "Doe roupas em bom estado na secretaria paroquial.",
    bgColor: "linear-gradient(135deg, #0369a1, #164e63)",
    order: 1,
  },
  {
    id: "banner-ns-1",
    tenantSlug: "nossa-senhora",
    tipo: "aviso",
    titulo: "Encontro de Catequese",
    mensagem: "Inscricoes abertas para novas turmas.",
    bgColor: "linear-gradient(135deg, #0f766e, #134e4a)",
    order: 0,
  },
];
