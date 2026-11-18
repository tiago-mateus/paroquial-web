import { ExternalLink, Facebook, Globe2, Instagram, Mail, MapPin, Phone, Youtube, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";
import type { PublicLink } from "../../shared/api/links";
import { formatBrazilianPhone } from "../../shared/lib/phone";

const colors: Record<string, string> = {
  slate: "#1e293b",
  blue: "#2563eb",
  green: "#16a34a",
  pink: "#db2777",
  red: "#dc2626",
  orange: "#ea580c",
  amber: "#d97706",
  indigo: "#4f46e5",
};

const icons: Record<string, LucideIcon> = {
  site: Globe2,
  whatsapp: Phone,
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  email: Mail,
  map: MapPin,
  link: ExternalLink,
};

export function normalizeLinkUrl(value: string) {
  const normalized = value.trim();
  if (!normalized) return null;
  if (/^(https?:|mailto:|tel:)/i.test(normalized)) return normalized;
  return `https://${normalized}`;
}

export function getLinkDomain(value: string) {
  const normalized = normalizeLinkUrl(value);
  if (!normalized || /^(mailto:|tel:)/i.test(normalized)) return null;
  try {
    return new URL(normalized).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function getLinkDestination(value: string) {
  const href = normalizeLinkUrl(value);
  const contact = href?.replace(/^(mailto:|tel:)/i, "").split("?")[0];
  if (/^tel:\+55\d{10,11}$/i.test(href ?? "") && contact) return formatBrazilianPhone(contact);
  return /^(mailto:|tel:)/i.test(href ?? "") ? contact : getLinkDomain(value);
}

export function resolveLinkColor(link: PublicLink) {
  const colorKey = link.colorKey?.trim().toLocaleLowerCase("pt-BR");
  if (colorKey && colors[colorKey]) return colors[colorKey];
  const custom = link.color?.trim();
  return custom && /^#[0-9a-f]{6}$/i.test(custom) ? custom : colors.slate;
}

export const LINK_TEMPLATES = ["default", "square", "outline", "soft", "filled", "pill"] as const;
export type LinkTemplate = (typeof LINK_TEMPLATES)[number];

export const LINK_TEMPLATE_LABELS: Record<LinkTemplate, string> = {
  default: "Arredondado",
  square: "Quadrado",
  outline: "Contorno",
  soft: "Suave",
  filled: "Preenchido",
  pill: "Pílula",
};

export function resolveLinkVariant(value?: string | null): LinkTemplate {
  const normalized = value?.trim().toLocaleLowerCase("pt-BR");
  return (LINK_TEMPLATES as readonly string[]).includes(normalized ?? "") ? (normalized as LinkTemplate) : "default";
}

export type LinkTemplateStyle = {
  /** classes do container do card */
  container: string;
  /** O suporte do ícone acompanha a geometria do botão. */
  iconShape: string;
  /** cor de fundo do tile do ícone (aceita a cor resolvida) */
  iconBg: (color: string) => string;
  /** cor do ícone */
  iconColor: (color: string) => string;
  /** classe do título */
  title: string;
  /** classe do subtítulo/domínio */
  subtitle: string;
  /** classe do ícone de ação à direita */
  action: string;
  /** estilo inline do container (para fundos coloridos) */
  containerStyle: (color: string) => CSSProperties;
};

function readableFilledColor(color: string) {
  let channels = [1, 3, 5].map((offset) => Number.parseInt(color.slice(offset, offset + 2), 16));
  // Preserve the configured hue while giving white labels sufficient contrast.
  const luminance = () => channels.reduce((total, channel, index) => {
    const value = channel / 255;
    const linear = value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    return total + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);
  while (luminance() > 0.12) channels = channels.map((channel) => Math.floor(channel * 0.95));
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

/** Estilos compartilhados entre a página pública e a prévia do admin. */
export function resolveLinkTemplate(link: PublicLink): LinkTemplateStyle {
  const template = resolveLinkVariant(link.variant);
  const color = resolveLinkColor(link);

  switch (template) {
    case "square":
      return {
        container: "rounded-none border border-line bg-white",
        iconShape: "rounded-none",
        iconBg: () => `${color}18`,
        iconColor: () => color,
        title: "text-ink",
        subtitle: "text-muted",
        action: "text-muted",
        containerStyle: () => ({}),
      };
    case "outline":
      return {
        container: "rounded-xl border-2 bg-white",
        iconShape: "rounded-lg",
        iconBg: () => `${color}14`,
        iconColor: () => color,
        title: "text-ink",
        subtitle: "text-muted",
        action: "text-muted",
        containerStyle: () => ({ borderColor: color }),
      };
    case "soft":
      return {
        container: "rounded-2xl border border-transparent",
        iconShape: "rounded-xl",
        iconBg: () => "rgba(255,255,255,0.65)",
        iconColor: () => color,
        title: "text-ink",
        subtitle: "text-muted",
        action: "text-muted",
        containerStyle: () => ({ backgroundColor: `${color}1f` }),
      };
    case "filled":
      return {
        container: "rounded-2xl border border-transparent text-white",
        iconShape: "rounded-xl",
        iconBg: () => "rgba(255,255,255,0.22)",
        iconColor: () => "#ffffff",
        title: "text-white",
        subtitle: "text-white/90",
        action: "text-white/90",
        containerStyle: () => ({ backgroundColor: readableFilledColor(color) }),
      };
    case "pill":
      return {
        container: "rounded-full border border-line bg-white",
        iconShape: "rounded-full",
        iconBg: () => `${color}18`,
        iconColor: () => color,
        title: "text-ink",
        subtitle: "text-muted",
        action: "text-muted",
        containerStyle: () => ({}),
      };
    default:
      return {
        container: "rounded-xl border border-line bg-white",
        iconShape: "rounded-lg",
        iconBg: () => `${color}18`,
        iconColor: () => color,
        title: "text-ink",
        subtitle: "text-muted",
        action: "text-muted",
        containerStyle: () => ({}),
      };
  }
}

export function resolveLinkIcon(link: PublicLink): LucideIcon {
  const configured = link.iconKey?.trim().toLocaleLowerCase("pt-BR");
  if (configured && icons[configured]) return icons[configured];

  const url = link.url.toLocaleLowerCase("pt-BR");
  if (url.includes("instagram")) return Instagram;
  if (url.includes("facebook")) return Facebook;
  if (url.includes("youtube") || url.includes("youtu.be")) return Youtube;
  if (url.includes("wa.me") || url.includes("whatsapp")) return Phone;
  if (url.startsWith("mailto:")) return Mail;
  if (url.includes("maps.google") || url.includes("google.com/maps")) return MapPin;
  if (url.startsWith("tel:")) return Phone;
  return ExternalLink;
}
