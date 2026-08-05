import { ExternalLink, Facebook, Globe2, Instagram, Mail, MapPin, Phone, Youtube, type LucideIcon } from "lucide-react";
import type { PublicLink } from "../../shared/api/links";

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

export function resolveLinkColor(link: PublicLink) {
  const colorKey = link.colorKey?.trim().toLocaleLowerCase("pt-BR");
  if (colorKey && colors[colorKey]) return colors[colorKey];
  const custom = link.color?.trim();
  return custom && /^#[0-9a-f]{6}$/i.test(custom) ? custom : colors.slate;
}

export function resolveLinkVariant(value?: string | null): "default" | "filled" | "pill" {
  return value === "filled" || value === "pill" ? value : "default";
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
