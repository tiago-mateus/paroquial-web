import type { PublicLink } from "../../shared/api/links";

export type MockPublicLink = PublicLink & { tenantSlug: string };

export const publicLinks: MockPublicLink[] = [
  { id: "link-site", tenantSlug: "sao-jose", title: "Site oficial", url: "paroquiasantoantonio.org.br", iconKey: "site", colorKey: "blue", variant: "default", order: 1, isActive: true },
  { id: "link-whatsapp", tenantSlug: "sao-jose", title: "WhatsApp da secretaria", url: "https://wa.me/11999999999", iconKey: "whatsapp", colorKey: "green", variant: "filled", order: 2, isActive: true },
  { id: "link-instagram", tenantSlug: "sao-jose", title: "Instagram", url: "https://www.instagram.com/paroquiasantoantonio", iconKey: "instagram", colorKey: "pink", variant: "pill", order: 3, isActive: true },
  { id: "link-youtube", tenantSlug: "sao-jose", title: "YouTube", url: "https://youtube.com/@paroquiasantoantonio", iconKey: "youtube", colorKey: "red", variant: "filled", order: 4, isActive: true },
  { id: "link-email", tenantSlug: "sao-jose", title: "E-mail", url: "mailto:secretaria@paroquia.org.br", iconKey: "email", colorKey: "indigo", variant: "default", order: 5, isActive: true },
  { id: "link-map", tenantSlug: "sao-jose", title: "Como chegar", url: "https://maps.google.com/?q=Paróquia Santo Antônio", iconKey: "map", colorKey: "amber", variant: "default", order: 6, isActive: true },
  { id: "link-phone", tenantSlug: "sao-jose", title: "Telefone", url: "tel:+551133332211", iconKey: null, colorKey: "orange", variant: "pill", order: 7, isActive: true },
  { id: "link-inactive", tenantSlug: "sao-jose", title: "Canal desativado", url: "https://example.com", iconKey: "link", colorKey: "slate", variant: "default", order: 0, isActive: false },
];
