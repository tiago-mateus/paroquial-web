import { ExternalLink, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { PublicLink } from "../../shared/api/links";
import { classNames } from "../../shared/lib/classNames";
import { trackPublicLinkClick } from "./linkAnalytics";
import { getLinkDomain, normalizeLinkUrl, resolveLinkColor, resolveLinkIcon, resolveLinkVariant } from "./linkPresentation";

export function PublicLinkCard({ link, tenantSlug }: { link: PublicLink; tenantSlug: string }) {
  const [opening, setOpening] = useState(false);
  const href = normalizeLinkUrl(link.url);
  const domain = getLinkDomain(link.url);
  const color = resolveLinkColor(link);
  const variant = resolveLinkVariant(link.variant);
  const Icon = resolveLinkIcon(link);

  useEffect(() => {
    if (!opening) return;
    const timeout = window.setTimeout(() => setOpening(false), 900);
    return () => window.clearTimeout(timeout);
  }, [opening]);

  if (!href) return null;
  const filled = variant === "filled";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Abrir ${link.title}`}
      onClick={() => {
        setOpening(true);
        trackPublicLinkClick(tenantSlug, link.id);
      }}
      className={classNames(
        "group grid min-h-[5.25rem] grid-cols-[2.75rem_minmax(0,1fr)_1.5rem] items-center gap-3 border p-4 transition duration-200 motion-reduce:transform-none motion-reduce:transition-none hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2",
        variant === "pill" ? "rounded-full" : "rounded-2xl",
        filled
          ? "border-transparent text-white shadow-[0_8px_22px_rgb(15_23_42/0.13)] hover:shadow-[0_12px_28px_rgb(15_23_42/0.18)]"
          : "border-slate-200 bg-white text-slate-950 shadow-[0_5px_18px_rgb(15_23_42/0.04)] hover:border-slate-300 hover:shadow-[0_9px_24px_rgb(15_23_42/0.08)]",
      )}
      style={filled ? { backgroundColor: color } : undefined}
    >
      <span
        className={classNames("grid place-items-center", variant === "pill" ? "h-8 w-8 rounded-full" : "h-11 w-11 rounded-xl", filled ? "bg-white/15 text-white" : "")}
        style={filled ? undefined : { backgroundColor: `${color}18`, color }}
      >
        <Icon aria-hidden="true" size={variant === "pill" ? 16 : 19} />
      </span>
      <span className="min-w-0">
        <strong className="block truncate text-sm font-bold">{link.title}</strong>
        {domain ? <small className={classNames("mt-1 block truncate text-xs", filled ? "text-white/70" : "text-slate-500")}>{domain}</small> : null}
      </span>
      <span className={classNames("grid h-6 w-6 place-items-center", filled ? "text-white/75" : "text-slate-400 group-hover:text-slate-700")}>
        {opening ? <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" size={16} /> : <ExternalLink aria-hidden="true" size={16} />}
      </span>
    </a>
  );
}
