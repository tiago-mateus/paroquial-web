import {
  Home,
  Link as LinkIcon,
  MapPin,
  MessageCircleMore,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { ConfessionScheduleItem, HomeActionsConfig, HomeHeaderConfig } from "../../shared/api/tenants";
import { classNames } from "../../shared/lib/classNames";
import { PublicDesktopNavigation } from "../../shared/components/PublicNavigation";
import { ConfessionAction } from "./ConfessionDialog";

type TopRightIcon = "home" | "links";
type HomeHeaderVariant = "default" | "compact";

type HomeHeaderProps = {
  tenantName: string;
  cidade?: string | null;
  headerConfig?: HomeHeaderConfig | null;
  fallbackImageUrl?: string | null;
  homeActions?: HomeActionsConfig | null;

  /**
   * Rotas públicas.
   *
   * homeHref e churchesHref são opcionais para manter compatibilidade
   * com chamadas antigas do componente.
   */
  homeHref?: string;
  linksHref: string;
  agendaHref: string;
  churchesHref?: string;

  contactHref?: string;
  confessionSchedule?: ConfessionScheduleItem[] | null;

  topRightHref?: string;
  topRightLabel?: string;
  topRightIcon?: TopRightIcon;
  variant?: HomeHeaderVariant;
  compactTitle?: string;
  compactDescription?: string;
  compactBadge?: string;
  /** Renderiza a composição pública dentro de uma prévia administrativa não interativa. */
  preview?: boolean;
};

type HomeAction = {
  label: string;
  subtitle: string;
  href?: string;
};

const actionCardBaseClass = (preview: boolean) =>
  `flex min-h-[54px] min-w-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition duration-200 ${preview ? "" : "md:min-h-[60px] md:px-4 md:py-3"}`;

export function HomeHeader({
  tenantName,
  cidade,
  headerConfig,
  fallbackImageUrl,
  homeHref,
  linksHref,
  agendaHref,
  contactHref,
  confessionSchedule,
  topRightHref,
  topRightLabel = "Links",
  topRightIcon,
  variant = "default",
  compactTitle,
  compactDescription,
  compactBadge,
  preview = false,
}: HomeHeaderProps) {
  const visual = resolveVisual(headerConfig, fallbackImageUrl);
  const compact = variant === "compact";

  const resolvedHomeHref = homeHref || resolveBaseHref(agendaHref);
  const tenantSlug = resolvedHomeHref.split("/").filter(Boolean)[0] ?? "";

  const confessionAction: HomeAction = {
    label: "Confissões",
    subtitle: "Ver horários",
    href: agendaHref,
  };

  const secretariaAction: HomeAction = {
    label: "Secretaria",
    subtitle: "Falar no WhatsApp",
    href: contactHref,
  };

  const resolvedTopRightIcon =
    topRightIcon || inferTopRightIcon(topRightLabel);

  return (
    <header
      className={classNames(
        "relative isolate overflow-hidden pt-4",
        preview ? "px-4" : "px-4 sm:px-6",
        preview ? "pb-10" : compact ? "pb-10 md:pb-10 md:pt-5" : "pb-10 md:pb-14 md:pt-6",
      )}
      style={visual.style}
    >
      {visual.imageUrl ? (
        <img
          src={visual.imageUrl}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-20 h-full w-full scale-[1.02] object-cover"
          style={{ opacity: visual.imageOpacity }}
        />
      ) : null}

      <div className="pointer-events-none absolute inset-0 -z-10 bg-black/45" />

      <div className={classNames(
        "mx-auto flex max-w-6xl flex-col",
        preview ? "min-h-[225px]" : compact ? "min-h-30 md:min-h-[190px]" : "min-h-30 md:min-h-[310px]",
      )}>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          {cidade?.trim() ? (
            <span className="inline-flex min-h-8 max-w-full min-w-0 items-center gap-1.5 justify-self-start rounded-full border border-white/20 bg-black/10 px-3 py-1 text-xs font-semibold text-white/90 shadow-sm backdrop-blur-xl">
              <MapPin size={13} aria-hidden="true" />

              <span className="truncate">{cidade.trim()}</span>
            </span>
          ) : (
            <span aria-hidden="true" />
          )}

          {!preview ? <PublicDesktopNavigation tenantSlug={tenantSlug} variant="onImage" /> : null}

          {compact && topRightHref ? (
            <Link
              to={topRightHref ?? linksHref}
              className="inline-flex min-h-8 min-w-0 items-center gap-1.5 rounded-full border border-white/20 bg-black/10 px-3 py-1 text-xs font-bold text-white/90 backdrop-blur-xl transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent md:hidden"
            >
              {resolvedTopRightIcon === "home" ? (
                <Home size={14} aria-hidden="true" />
              ) : (
                <LinkIcon size={14} aria-hidden="true" />
              )}

              <span className="max-w-24 truncate">
                {topRightLabel}
              </span>
            </Link>
          ) : null}
        </div>

        <div className={classNames("mt-auto", preview ? "max-w-3xl pt-7" : compact ? "pt-8 md:pt-10" : "max-w-3xl pt-7 md:pt-12")}>
          {!compact ? (
            <p className="mb-1 text-[0.62rem] font-bold uppercase tracking-[0.15em] text-amber-100/85 md:text-[0.68rem] md:tracking-[0.16em]">
              {getGreeting()} — seja bem-vindo
            </p>
          ) : null}

          {compact ? (
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0 max-w-3xl">
                <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-amber-100/80">{tenantName}</p>
                <h1 className="m-0 max-w-[26ch] text-[1.75rem] font-bold leading-[1.05] tracking-[-0.025em] text-white drop-shadow-md sm:text-[2.1rem] md:text-[2.5rem]">
                  {compactTitle || tenantName}
                </h1>
                {compactDescription ? <p className="mb-0 mt-2 max-w-xl text-xs font-medium leading-5 text-white/70 md:text-sm">{compactDescription}</p> : null}
              </div>
              {compactBadge ? <span className="mb-0.5 flex-none rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/90 shadow-sm backdrop-blur-xl">{compactBadge}</span> : null}
            </div>
          ) : (
            <h1 className={classNames("m-0 max-w-[22ch] text-[1.95rem] font-bold leading-[1.06] tracking-[-0.025em] text-white drop-shadow-md", preview ? "" : "sm:text-[2.4rem] md:max-w-[18ch] md:text-5xl")}>
              {tenantName}
            </h1>
          )}
        </div>

        {!compact ? (
          <div className={classNames("grid grid-cols-2 gap-2 pt-5", preview ? "" : "md:max-w-xl md:gap-3 md:pt-6")}>
            <SecretaryAction action={secretariaAction} preview={preview} />

            <ConfessionAction
              action={confessionAction}
              schedule={confessionSchedule}
              preview={preview}
            />
          </div>
        ) : null}
      </div>
    </header>
  );
}

function SecretaryAction({
  action,
  preview,
}: {
  action: HomeAction;
  preview: boolean;
}) {
  const content = (
    <>
      <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <MessageCircleMore size={16} aria-hidden="true" />
      </span>

      <span className="grid min-w-0 flex-1">
        <span className="truncate text-xs font-extrabold leading-tight">
          {action.label}
        </span>

        <small className="truncate text-[0.65rem] leading-tight text-inherit opacity-70">
          {action.subtitle}
        </small>
      </span>
    </>
  );

  if (!action.href) {
    return (
      <div
        aria-disabled="true"
        className={[
          actionCardBaseClass(preview),
          "cursor-not-allowed border-white/15 bg-white/10 text-white/60 backdrop-blur-md",
        ].join(" ")}
      >
        {content}
      </div>
    );
  }

  const className = [
    actionCardBaseClass(preview),
          "border-white bg-white text-slate-950 shadow-sm",
          "hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
  ].join(" ");

  if (isExternalHref(action.href)) {
    return (
      <a
        href={action.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <Link to={action.href} className={className}>
      {content}
    </Link>
  );
}

function resolveVisual(
  headerConfig?: HomeHeaderConfig | null,
  fallbackImageUrl?: string | null,
) {
  const gradientFrom =
    headerConfig?.gradientFrom?.trim() || "#7c2d12";

  const imageUrl =
    headerConfig?.imageUrl?.trim() || fallbackImageUrl?.trim() || null;

  const imageOpacity =
    typeof headerConfig?.imageOpacity === "number"
      ? clamp(headerConfig.imageOpacity, 0, 1)
      : 0.3;

  return {
    imageUrl,
    imageOpacity,
    style: {
      backgroundColor: gradientFrom,
    },
  };
}

function getGreeting(date = new Date()) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return "Bom dia";
  }

  if (hour >= 12 && hour < 18) {
    return "Boa tarde";
  }

  return "Boa noite";
}

function inferTopRightIcon(
  label: string,
): TopRightIcon {
  const normalizedLabel = label
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return normalizedLabel === "inicio"
    ? "home"
    : "links";
}

function isExternalHref(href: string) {
  return /^(https?:\/\/|mailto:|tel:|sms:|whatsapp:)/i.test(
    href,
  );
}

function resolveBaseHref(agendaHref: string) {
  const hrefWithoutQueryOrHash = agendaHref.replace(
    /[?#].*$/,
    "",
  );

  const resolvedHref = hrefWithoutQueryOrHash.replace(
    /\/(?:calendario|agenda)\/?$/,
    "",
  );

  return resolvedHref || "/";
}

function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.min(max, Math.max(min, value));
}
