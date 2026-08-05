import {
  CalendarDays,
  Church,
  Home,
  Link as LinkIcon,
  Link2,
  MapPin,
  MessageCircleMore,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import type {
  ConfessionScheduleItem,
  HomeActionsConfig,
  HomeHeaderConfig,
} from "../../shared/api/tenants";
import { classNames } from "../../shared/lib/classNames";
import { ConfessionAction } from "./ConfessionDialog";

type TopRightIcon = "home" | "links";
type HomeHeaderVariant = "default" | "compact";

type HomeHeaderProps = {
  tenantName: string;
  cidade?: string | null;
  headerConfig?: HomeHeaderConfig | null;
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
};

type HomeAction = {
  label: string;
  subtitle: string;
  href?: string;
};

const INVALID_LEGACY_LABELS = new Set(["Confis"]);

const actionCardBaseClass =
  "flex min-h-[54px] min-w-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition duration-200 md:min-h-[60px] md:px-4 md:py-3";

export function HomeHeader({
  tenantName,
  cidade,
  headerConfig,
  homeActions,
  homeHref,
  linksHref,
  agendaHref,
  churchesHref,
  contactHref,
  confessionSchedule,
  topRightHref,
  topRightLabel = "Links",
  topRightIcon,
  variant = "default",
  compactTitle,
  compactDescription,
  compactBadge,
}: HomeHeaderProps) {
  const visual = resolveVisual(headerConfig);
  const compact = variant === "compact";

  const resolvedHomeHref = homeHref || resolveBaseHref(agendaHref);
  const resolvedChurchesHref =
    churchesHref || joinRoute(resolvedHomeHref, "igrejas");

  const confessionAction: HomeAction = {
    label: normalizeLabel(
      homeActions?.confissoes?.label,
      "Confissões",
    ),
    subtitle:
      homeActions?.confissoes?.subtitle?.trim() || "Ver horários",
    href: homeActions?.confissoes?.href?.trim() || agendaHref,
  };

  const secretariaAction: HomeAction = {
    label: normalizeLabel(
      homeActions?.secretaria?.label,
      "Secretaria",
    ),
    subtitle:
      homeActions?.secretaria?.subtitle?.trim() ||
      "Falar no WhatsApp",
    href: homeActions?.secretaria?.href?.trim() || contactHref,
  };

  const resolvedTopRightIcon =
    topRightIcon || inferTopRightIcon(topRightLabel);

  return (
    <header
      className={classNames(
        "relative isolate overflow-hidden px-4 pt-4 sm:px-6",
        compact ? "pb-10 md:pb-10 md:pt-5" : "pb-10 md:pb-14 md:pt-6",
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

      <div className="pointer-events-none absolute inset-0 -z-10 bg-black/10" />

      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.30)_0%,rgba(0,0,0,0.08)_42%,rgba(0,0,0,0.62)_100%)]" />

      <div className={classNames(
        "mx-auto flex max-w-6xl flex-col",
        compact ? "min-h-30 md:min-h-[190px]" : "min-h-30 md:min-h-[310px]",
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

          <DesktopNavigation
            homeHref={resolvedHomeHref}
            agendaHref={agendaHref}
            churchesHref={resolvedChurchesHref}
            linksHref={linksHref}
          />

          {compact ? (
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

        <div className={classNames("mt-auto", compact ? "pt-8 md:pt-10" : "max-w-3xl pt-7 md:pt-12")}>
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
            <h1 className="m-0 max-w-[22ch] text-[1.95rem] font-bold leading-[1.06] tracking-[-0.025em] text-white drop-shadow-md sm:text-[2.4rem] md:max-w-[18ch] md:text-5xl">
              {tenantName}
            </h1>
          )}
        </div>

        {!compact ? (
          <div className="grid grid-cols-2 gap-2 pt-5 md:max-w-xl md:gap-3 md:pt-6">
            <SecretaryAction action={secretariaAction} />

            <ConfessionAction
              action={confessionAction}
              schedule={confessionSchedule}
            />
          </div>
        ) : null}
      </div>
    </header>
  );
}

type DesktopNavigationProps = {
  homeHref: string;
  agendaHref: string;
  churchesHref: string;
  linksHref: string;
};

function DesktopNavigation({
  homeHref,
  agendaHref,
  churchesHref,
  linksHref,
}: DesktopNavigationProps) {
  const items = [
    {
      label: "Início",
      href: homeHref,
      icon: Home,
      end: true,
    },
    {
      label: "Agenda",
      href: agendaHref,
      icon: CalendarDays,
      end: false,
    },
    {
      label: "Igrejas",
      href: churchesHref,
      icon: Church,
      end: false,
    },
    {
      label: "Links",
      href: linksHref,
      icon: Link2,
      end: false,
    },
  ];

  return (
    <nav
      aria-label="Navegação pública"
      className="hidden items-center gap-1 rounded-full border border-white/15 bg-black/10 p-1 shadow-sm backdrop-blur-xl md:flex"
    >
      {items.map(({ icon: Icon, label, href, end }) => (
        <NavLink
          key={label}
          end={end}
          to={href}
          className={({ isActive }) =>
            [
              "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
              isActive
                ? "bg-white text-slate-950 shadow-sm hover:bg-white hover:text-slate-950"
                : "text-white/80 hover:bg-white/10 hover:text-white",
            ].join(" ")
          }
        >
          <Icon size={14} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function SecretaryAction({
  action,
}: {
  action: HomeAction;
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
          {action.href
            ? action.subtitle
            : "Contato indisponível"}
        </small>
      </span>
    </>
  );

  if (!action.href) {
    return (
      <div
        aria-disabled="true"
        className={[
          actionCardBaseClass,
          "cursor-not-allowed border-white/15 bg-white/10 text-white/60 backdrop-blur-md",
        ].join(" ")}
      >
        {content}
      </div>
    );
  }

  const className = [
    actionCardBaseClass,
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
) {
  const gradientFrom =
    headerConfig?.gradientFrom?.trim() || "#7c2d12";

  const gradientTo =
    headerConfig?.gradientTo?.trim() || "#263241";

  const imageUrl =
    headerConfig?.imageUrl?.trim() || null;

  const imageOpacity =
    typeof headerConfig?.imageOpacity === "number"
      ? clamp(headerConfig.imageOpacity, 0, 1)
      : 0.3;

  return {
    imageUrl,
    imageOpacity,
    style: {
      backgroundColor: gradientFrom,
      backgroundImage: `linear-gradient(120deg, ${gradientFrom}, ${gradientTo})`,
    },
  };
}

function normalizeLabel(
  value: string | null | undefined,
  fallback: string,
) {
  const normalized = value?.trim();

  if (
    !normalized ||
    INVALID_LEGACY_LABELS.has(normalized)
  ) {
    return fallback;
  }

  return normalized;
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

function joinRoute(
  baseHref: string,
  route: string,
) {
  const normalizedBase =
    baseHref === "/"
      ? ""
      : baseHref.replace(/\/+$/, "");

  const normalizedRoute = route.replace(/^\/+/, "");

  return `${normalizedBase}/${normalizedRoute}`;
}

function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.min(max, Math.max(min, value));
}
