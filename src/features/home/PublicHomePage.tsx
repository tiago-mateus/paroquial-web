import { useQuery } from "@tanstack/react-query";
import { ArrowDown, CalendarDays, ChevronRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getTenantBanners } from "../../shared/api/banners";
import { getTenantEvents } from "../../shared/api/events";
import { getTodayLiturgy } from "../../shared/api/liturgy";
import { usePublicTenant } from "../../shared/hooks/usePublicTenant";
import { usePublicChurches } from "../../shared/hooks/usePublicChurches";
import { toDateKey } from "../../shared/lib/date";
import { resolveParishCover } from "../../shared/lib/parishCover";
import { EventListPlaceholder, EventListSkeleton } from "../events/EventListSkeleton";
import { SectionHeading } from "../../shared/components/SectionHeading";
import { getBrazilianWhatsappHref } from "../../shared/lib/phone";
import { ErrorState } from "../../shared/components/PageState";
import { PublicPageCoverSkeleton } from "../../shared/components/PublicPageCover";
import { SkeletonShape, SkeletonStatus } from "../../shared/components/PublicSkeleton";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";
import { getEventsForDate } from "../calendar/calendar.utils";
import { HighlightSkeletonCard, HomeHighlights } from "./HomeHighlights";
import { HomeHeader } from "./HomeHeader";
import { TodayEventsList } from "./TodayEventsList";

export function PublicHomePage() {
  const { tenantSlug = "" } = useParams();
  const today = new Date();
  const todayKey = toDateKey(today);
  const rangeEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
  const rangeEndKey = toDateKey(rangeEnd);
  const tenantQuery = usePublicTenant(tenantSlug);
  const bannersQuery = useQuery({
    queryKey: ["banners", tenantSlug],
    queryFn: () => getTenantBanners(tenantSlug),
    enabled: Boolean(tenantSlug),
  });
  const churchesQuery = usePublicChurches(tenantSlug, { retry: false });
  const eventsQuery = useQuery({
    queryKey: ["events", tenantSlug, todayKey, rangeEndKey],
    queryFn: () => getTenantEvents(tenantSlug, todayKey, rangeEndKey),
    enabled: Boolean(tenantSlug),
  });
  const liturgyQuery = useQuery({
    queryKey: ["liturgy", todayKey],
    queryFn: getTodayLiturgy,
  });
  useDocumentTitle("Início", tenantQuery.data?.name);

  if (tenantQuery.isLoading) return <HomeSkeleton />;

  if (tenantQuery.isError || !tenantQuery.data) {
    return (
      <main className="grid min-h-dvh max-w-none place-items-center bg-white p-6 text-center text-ink">
        <ErrorState title="Paróquia não encontrada" description="Confira o endereço acessado ou tente novamente." />
      </main>
    );
  }

  const tenant = tenantQuery.data;
  const cityLabel = [tenant.cidade, tenant.estado].filter(Boolean).join(" · ");
  const contactValue = tenant.telefone;
  const contactHref = getBrazilianWhatsappHref(contactValue);
  const linksHref = `/${tenantSlug}/links`;
  const agendaHref = `/${tenantSlug}/calendario`;
  const sortedEvents = [...(eventsQuery.data ?? [])].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );
  const todayEvents = getEventsForDate(sortedEvents, today);
  const nextEvent = sortedEvents.find((event) => new Date(event.start) > today && !todayEvents.includes(event));
  const fallbackImageUrl = resolveParishCover({ churches: churchesQuery.data });

  return (
    <main className="min-h-dvh max-w-none bg-canvas p-0 text-ink">
      <HomeHeader
        tenantName={tenant.name}
        cidade={cityLabel}
        headerConfig={tenant.homeHeader}
        fallbackImageUrl={fallbackImageUrl}
        homeActions={tenant.homeActions}
        linksHref={linksHref}
        agendaHref={agendaHref}
        contactHref={contactHref}
        confessionSchedule={tenant.confessionSchedule}
      />

      <section className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="pb-12 pt-5 sm:pt-8">
          <div className="grid min-w-0 gap-4 sm:gap-8">
            <div className="grid min-w-0 gap-3">
              <HomeHighlights
                banners={bannersQuery.data ?? []}
                bannersLoading={bannersQuery.isLoading}
                reading={liturgyQuery.data}
                readingStatus={liturgyQuery.isLoading ? "loading" : liturgyQuery.isError ? "error" : "ready"}
                includeLiturgy
                action={todayEvents.length > 0 ? <a href="#today-agenda-title" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold text-primary hover:bg-selection focus-visible:outline-2 focus-visible:outline-focus"><CalendarDays size={15} aria-hidden="true" />{todayEvents.length} {todayEvents.length === 1 ? "evento hoje" : "eventos hoje"}<ArrowDown size={14} aria-hidden="true" /></a> : undefined}
              />
              {bannersQuery.isError ? <div><p className="m-0 text-base text-muted">Não foi possível carregar os avisos da comunidade.</p><button type="button" onClick={() => void bannersQuery.refetch()} className="mt-1 min-h-11 rounded-lg text-sm font-semibold text-primary">Tentar novamente</button></div> : null}
            </div>
            <section className="grid min-w-0 gap-3 sm:gap-4" aria-labelledby="today-agenda-title">
              <SectionHeading id="today-agenda-title" title="Agenda de hoje" description={<span className="font-medium leading-5">{formatDateLong(today)}</span>} className="scroll-mt-5 flex-wrap items-center gap-x-2 gap-y-1 pt-1 [&_h2]:scroll-mt-5" action={
                <Link
                  to={agendaHref}
                  className="group inline-flex min-h-11 flex-none items-center gap-1 rounded-lg border border-line bg-surface px-3 text-[13px] font-semibold text-primary transition-colors duration-200 hover:border-control-border hover:bg-selection active:bg-selection focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none sm:text-sm"
                >
                  Ver agenda
                  <ChevronRight
                    aria-hidden="true"
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                    size={15}
                  />
                </Link>
              } />

              {eventsQuery.isLoading ? (
                <EventListSkeleton count={2} label="Carregando agenda…" variant="home" />
              ) : eventsQuery.isError ? (
                <ErrorState title="Não foi possível carregar a agenda" description="Tente novamente em instantes." />
              ) : (
                <div className="overflow-hidden rounded-2xl border border-line bg-surface"><TodayEventsList events={todayEvents} nextEvent={nextEvent} agendaHref={agendaHref} /></div>
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function HomeSkeleton() {
  return (
    <main className="min-h-dvh max-w-none bg-canvas p-0 text-ink">
      <SkeletonStatus label="Preparando a sua paróquia…">
        <PublicPageCoverSkeleton variant="home" />
        <div className="mx-auto grid max-w-6xl gap-4 px-5 pb-12 pt-5 sm:gap-8 sm:px-6 sm:pt-8">
          <div className="grid gap-3">
            <SkeletonShape className="h-7 w-32 rounded-md sm:h-8" />
            <div className="flex min-w-0 gap-3 overflow-hidden">
              <div className="flex basis-[92%] shrink-0 sm:basis-3/4 lg:basis-3/5"><HighlightSkeletonCard /></div>
              <div className="flex basis-[92%] shrink-0 sm:basis-3/4 lg:basis-3/5"><HighlightSkeletonCard /></div>
            </div>
          </div>
          <div className="grid gap-3">
            <SkeletonShape className="h-7 w-40 rounded-md sm:h-8" />
            <EventListPlaceholder count={2} variant="home" />
          </div>
        </div>
      </SkeletonStatus>
    </main>
  );
}

function formatDateLong(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(date).replace(".", "");
}
