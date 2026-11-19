import { ArrowUpRight, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { PublicLink } from "../../shared/api/links";
import { SkeletonShape } from "../../shared/components/PublicSkeleton";
import { trackPublicLinkClick } from "./linkAnalytics";
import { getLinkDestination, normalizeLinkUrl, resolveLinkColor, resolveLinkIcon, resolveLinkTemplate } from "./linkPresentation";

const linkCardLayout = "grid min-h-20 grid-cols-[2.5rem_minmax(0,1fr)_1.25rem] items-center gap-3 px-4 py-3.5";

export function PublicLinkCardSkeleton({ short = false }: { short?: boolean }) {
  return (
    <div className={`${linkCardLayout} rounded-xl border border-neutral-200 bg-neutral-50`}>
      <SkeletonShape className="size-10 rounded-xl" />
      <div className="min-w-0 space-y-2">
        <SkeletonShape className={`h-4 max-w-48 rounded ${short ? "w-3/5" : "w-4/5"}`} />
        <SkeletonShape className="h-3 w-2/5 max-w-24 rounded" />
      </div>
      <SkeletonShape className="size-3.5 justify-self-center rounded" />
    </div>
  );
}

export function PublicLinkCard({ link, tenantSlug }: { link: PublicLink; tenantSlug: string }) {
  const [opening, setOpening] = useState(false);
  const href = normalizeLinkUrl(link.url);
  const isContact = /^(mailto:|tel:)/i.test(href ?? "");
  useEffect(() => {
    if (!opening) return;
    const timeout = window.setTimeout(() => setOpening(false), 900);
    return () => window.clearTimeout(timeout);
  }, [opening]);

  if (!href) return null;
  const template = resolveLinkTemplate(link);
  return (
    <a
      href={href}
      target={isContact ? undefined : "_blank"}
      rel={isContact ? undefined : "noopener noreferrer"}
      aria-label={`${link.title}${isContact ? "" : " (abre em nova aba)"}`}
      onClick={() => {
        setOpening(true);
        trackPublicLinkClick(tenantSlug, link.id);
      }}
      style={template.containerStyle(resolveLinkColor(link))}
      className={`${linkCardLayout} group h-full transition-colors duration-200 motion-reduce:transition-none hover:brightness-95 focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-4 ${template.container}`}
    >
      <LinkCardContent link={link} opening={opening} />
    </a>
  );
}

export function PublicLinkPreview({ link }: { link: PublicLink }) {
  const template = resolveLinkTemplate(link);
  return (
    <div className={`${linkCardLayout} ${template.container}`} style={template.containerStyle(resolveLinkColor(link))}>
      <LinkCardContent link={link} />
    </div>
  );
}

function LinkCardContent({ link, opening = false }: { link: PublicLink; opening?: boolean }) {
  const destination = getLinkDestination(link.url);
  const color = resolveLinkColor(link);
  const Icon = resolveLinkIcon(link);
  const template = resolveLinkTemplate(link);

  return <>
    <span
      className={`grid h-10 w-10 place-items-center ${template.iconShape}`}
      style={{ backgroundColor: template.iconBg(color), color: template.iconColor(color) }}
    >
      <Icon aria-hidden="true" size={20} />
    </span>
    <span className="min-w-0">
      <strong className={`block [overflow-wrap:anywhere] text-base font-bold leading-6 ${template.title}`}>{link.title}</strong>
      {destination ? <small className={`mt-1 block [overflow-wrap:anywhere] text-[13px] leading-[18px] ${template.subtitle}`}>{destination}</small> : null}
    </span>
    <span className={`grid h-5 w-5 place-items-center ${template.action}`}>
      {opening ? <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" size={16} /> : <ArrowUpRight aria-hidden="true" size={18} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none" />}
    </span>
  </>;
}
