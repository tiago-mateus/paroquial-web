import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getTenantBanners } from "../../shared/api/banners";
import { getTenantChurches } from "../../shared/api/churches";
import { getTenantEvents } from "../../shared/api/events";
import { getTodayLiturgy } from "../../shared/api/liturgy";
import { getTenant } from "../../shared/api/tenants";
import { getBrazilianWhatsappHref } from "../../shared/lib/phone";
import { ErrorState, LoadingState } from "../../shared/components/PageState";
import { SectionHeading } from "../../shared/components/SectionHeading";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";
import { getEventsForDate } from "../calendar/calendar.utils";
import { HomeBannerCarousel } from "./HomeBannerCarousel";
import { HomeHeader } from "./HomeHeader";
import { TodayEventsList } from "./TodayEventsList";

export function PublicHomePage() {
  const { tenantSlug = "" } = useParams();
  const today = new Date();
  const todayKey = toDateString(today);
  const rangeEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
  const rangeEndKey = toDateString(rangeEnd);
  const tenantQuery = useQuery({
    queryKey: ["tenant", tenantSlug],
    queryFn: () => getTenant(tenantSlug),
    enabled: Boolean(tenantSlug),
  });
  const bannersQuery = useQuery({
    queryKey: ["banners", tenantSlug],
    queryFn: () => getTenantBanners(tenantSlug),
    enabled: Boolean(tenantSlug),
  });
  const churchesQuery = useQuery({ queryKey: ["churches", tenantSlug], queryFn: () => getTenantChurches(tenantSlug), enabled: Boolean(tenantSlug), retry: false });
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

  if (tenantQuery.isLoading) return <HomeSkeleton title="Preparando a sua paróquia..." />;

  if (tenantQuery.isError || !tenantQuery.data) {
    return (
      <main className="grid min-h-dvh max-w-none place-items-center bg-white p-6 text-center text-slate-900">
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
  const fallbackImageUrl = churchesQuery.data?.find((church) => church.tipo === "matriz" && church.urlImg?.trim())?.urlImg
    ?? churchesQuery.data?.find((church) => church.urlImg?.trim())?.urlImg;

  return (
    <main className="min-h-dvh max-w-none bg-white p-0 text-slate-900">
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

      <section className="relative z-[2] mx-auto -mt-7 max-w-6xl px-0 sm:px-4 md:-mt-12">
        <div className="rounded-t-[2rem] bg-white px-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] pt-5 shadow-[0_-18px_50px_rgb(15_23_42/0.13)] sm:rounded-[2rem] sm:px-6 md:p-8">
          <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.75fr)] lg:gap-10">
            <div className="order-1 grid gap-4 lg:order-1">
              <SectionHeading
                title="Destaques"
                meta="da comunidade"
                className="hidden lg:flex"
              />
              {bannersQuery.isLoading || liturgyQuery.isLoading ? (
                <div className="min-h-40 animate-pulse rounded-[1.35rem] bg-slate-100" aria-label="Carregando destaques" />
              ) : (
                <HomeBannerCarousel
                  banners={bannersQuery.data ?? []}
                  evangelho={liturgyQuery.data ?? null}
                />
              )}
            </div>

            <section className="order-1 grid gap-2 lg:order-2" aria-labelledby="today-agenda-title">
              <header className="flex items-start justify-between gap-4 px-1 pt-1">
                <div className="min-w-0">
                  <p className="m-0 text-[0.68rem] font-extrabold uppercase tracking-[0.15em] text-amber-700">
                    Hoje · {formatDateLong(today)}
                  </p>
                  <h2
                    id="today-agenda-title"
                    className="mb-0 mt-1 text-[1.4rem] font-bold leading-tight text-slate-950"
                  >
                    Agenda de hoje
                  </h2>
                </div>

                <Link
                  to={agendaHref}
                  className="group inline-flex min-h-11 flex-none items-center gap-0.5 rounded-xl px-2 text-xs font-bold text-slate-600 transition-colors duration-200 hover:bg-slate-50 hover:text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/35"
                >
                  Ver agenda
                  <ChevronRight
                    aria-hidden="true"
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                    size={15}
                  />
                </Link>
              </header>

              {eventsQuery.isLoading ? (
                <TodayEventsSkeleton />
              ) : eventsQuery.isError ? (
                <ErrorState title="Não foi possível carregar a agenda" description="Tente novamente em instantes." />
              ) : (
                <TodayEventsList events={todayEvents} nextEvent={nextEvent} agendaHref={agendaHref} />
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function TodayEventsSkeleton() {
  return (
    <div
      className="relative overflow-hidden rounded-[1.2rem] border border-slate-200/80 bg-white px-4 shadow-[0_4px_18px_rgb(15_23_42/0.035)]"
      aria-label="Carregando agenda"
    >
      <span aria-hidden="true" className="absolute bottom-[3.05rem] left-[1.125rem] top-[1.69rem] w-px bg-slate-200" />
      {[0, 1].map((item) => (
        <div
          key={item}
          aria-hidden="true"
          className="relative grid min-h-[4.75rem] animate-pulse grid-cols-[2.25rem_3.25rem_minmax(0,1fr)_1rem] items-stretch gap-x-2 py-3.5 pr-2"
        >
          <span className="relative z-[1] flex items-start justify-center pt-1.5">
            <span className="h-3.5 w-3.5 rounded-full border-[3px] border-slate-200 bg-white" />
          </span>
          <span className="mt-1 h-4 w-10 rounded bg-slate-100" />
          <span className="self-center">
            <span className="block h-4 w-3/5 rounded bg-slate-100" />
            <span className="mt-2 block h-3 w-2/5 rounded bg-slate-100" />
          </span>
          <span />
        </div>
      ))}
      <span className="sr-only" role="status">Carregando agenda...</span>
    </div>
  );
}

function HomeSkeleton({ title }: { title: string }) {
  return (
    <main className="min-h-dvh max-w-none bg-white p-0 text-slate-900">
      <div className="min-h-[274px] animate-pulse bg-slate-800 md:min-h-[360px]" />
      <section className="relative z-[2] mx-auto -mt-7 max-w-6xl sm:px-4 md:-mt-12">
        <div className="min-h-[28rem] rounded-t-[2rem] bg-white px-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] pt-7 shadow-[0_-18px_50px_rgb(15_23_42/0.13)] sm:rounded-[2rem] md:pb-7">
          <LoadingState title={title} />
        </div>
      </section>
    </main>
  );
}

function toDateString(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDateLong(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date).replace(".", "");
}
