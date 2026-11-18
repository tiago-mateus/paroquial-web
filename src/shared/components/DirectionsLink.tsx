import { ArrowUpRight, Navigation } from "lucide-react";
import { classNames } from "../lib/classNames";

type Props = {
  href?: string | null;
  destination?: string;
  variant?: "primary" | "text";
  trailingIcon?: boolean;
  className?: string;
};

export function DirectionsLink({ href, destination, variant = "primary", trailingIcon = false, className }: Props) {
  if (!href) return null;
  return <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Como chegar${destination ? ` a ${destination}` : ""} (abre em nova aba)`} className={classNames(
    "inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold focus-visible:outline-2 focus-visible:outline-focus",
    variant === "primary" ? "bg-primary px-3 text-white hover:bg-primary-hover" : "px-2 text-primary hover:bg-selection",
    className,
  )}><Navigation size={16} aria-hidden="true" />Como chegar{trailingIcon ? <ArrowUpRight size={14} aria-hidden="true" /> : null}</a>;
}
