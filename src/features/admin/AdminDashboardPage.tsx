import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Building2,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Link2,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { getTenantChurches } from "../../shared/api/churches";
import { getAdminTenantEvents, type CalendarEvent, type EventType } from "../../shared/api/events";
import { getTenantLinks } from "../../shared/api/links";
import { getTenant } from "../../shared/api/tenants";
import { classNames } from "../../shared/lib/classNames";
import { getEventsForDate, toDateKey } from "../calendar/calendar.utils";
import { formatEventTime, hasEventFinished, isEventHappeningNow } from "../events/event.utils";
import { useNow } from "../events/useNow";
import { AdminPageHeader } from "./AdminPageHeader";

const fullDate = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
const shortDate = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "short" });
const eventTypeLabels: Record<EventType, string> = {
  missa: "Missa",
  novena: "Novena",
  reuniao: "Reunião",
  encontro: "Encontro",
  adoracao: "Adoração",
  movimento: "Movimento",
  outro: "Evento",
};

type PendingItem = { label: string; description: string; href: string };

export function AdminDashboardPage() {
  const { tenantSlug = "" } = useParams();
  const now = useNow();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const rangeEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
  const todayKey = toDateKey(today);
  const rangeEndKey = toDateKey(rangeEnd);

  const tenantQuery = useQuery({
    queryKey: ["tenant", tenantSlug],
    queryFn: () => getTenant(tenantSlug),
    enabled: Boolean(tenantSlug),
  });
  const eventsQuery = useQuery({
    queryKey: ["admin", "events", tenantSlug, todayKey, rangeEndKey],
    queryFn: () => getAdminTenantEvents(tenantSlug, todayKey, rangeEndKey),
    enabled: Boolean(tenantSlug),
  });
  const churchesQuery = useQuery({
    queryKey: ["churches", tenantSlug],
    queryFn: () => getTenantChurches(tenantSlug),
    enabled: Boolean(tenantSlug),
    retry: false,
  });
  const linksQuery = useQuery({
    queryKey: ["links", tenantSlug],
    queryFn: () => getTenantLinks(tenantSlug),
    enabled: Boolean(tenantSlug),
    retry: false,
  });

  const events = eventsQuery.data ?? [];
  const todayEvents = getEventsForDate(events, today).sort((a, b) => a.start.localeCompare(b.start));
  const highlightedId = todayEvents.find((event) => !hasEventFinished(event, now))?.occurrenceId;
  const futureEvents = events
    .filter((event) => new Date(event.start) > now)
    .sort((a, b) => a.start.localeCompare(b.start));
  const nextScheduledEvent = futureEvents[0];
  const tenantName = tenantQuery.data?.name ?? "Sua paróquia";
  const isLoading = tenantQuery.isLoading || eventsQuery.isLoading;
  const pendingItems = getPendingItems(tenantSlug, tenantQuery.data, eventsQuery.data, churchesQuery.data);
  const todayStatus = getTodayStatus(todayEvents, now);

  return (
    <section className="min-h-[calc(100dvh-4rem)] bg-stone-50 text-slate-950 md:min-h-dvh">
      <AdminPageHeader
        eyebrow="Administração"
        title="Visão geral"
        description="Acompanhe a operação e acesse as tarefas mais frequentes."
        actions={
          <Link
            to={`/${tenantSlug}`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
          >
            <ExternalLink size={15} /> Ver site público
          </Link>
        }
      />

      <div className="mx-auto max-w-7xl pb-6 md:px-6 md:py-6 lg:px-8">
        {/* Hero — summary + próximo evento */}
        <section
          className="overflow-hidden bg-slate-950 text-white md:grid md:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] md:rounded-2xl"
          aria-labelledby="dashboard-summary-title"
        >
          <div className="px-4 py-5 md:px-6 md:py-6">
            <p className="m-0 text-[0.62rem] font-extrabold uppercase tracking-normal text-amber-300 first-letter:uppercase">
              {fullDate.format(today)}
            </p>
            <div className="mt-2 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <h1
                  id="dashboard-summary-title"
                  className="m-0 line-clamp-2 text-xl font-bold leading-snug md:line-clamp-1 md:text-2xl"
                >
                  {tenantName}
                </h1>
                <p className="m-0 mt-1.5 text-sm text-slate-300">
                  {isLoading ? "Carregando a agenda de hoje..." : todayStatus}
                </p>
              </div>
              {/* Botão principal: label visível em qualquer tamanho */}
              <Link
                to={`/${tenantSlug}/admin/calendario?date=${todayKey}&action=new`}
                aria-label="Criar evento hoje"
                className="inline-flex h-11 flex-none items-center justify-center gap-2 rounded-xl bg-white px-3.5 text-xs font-bold text-slate-950 transition hover:bg-amber-50 active:scale-95"
              >
                <CalendarPlus size={18} />
                <span className="hidden xs:inline sm:inline">Novo evento</span>
                <span className="sr-only xs:hidden sm:hidden">Novo evento</span>
              </Link>
            </div>
          </div>
          <NextEventHighlight event={nextScheduledEvent} tenantSlug={tenantSlug} />
        </section>

        {/* Grid de conteúdo principal */}
        <div className="grid md:mt-5 md:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.75fr)] md:items-start md:gap-5">
          {/* Coluna esquerda */}
          <div className="min-w-0">
            {/* Programação de hoje */}
            <section
              className="mt-4 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm md:mt-0 md:shadow-none"
              aria-labelledby="today-events-title"
            >
              <div className="flex items-center justify-between px-4 pb-2 pt-4 md:px-5">
                <div>
                  <h2 id="today-events-title" className="m-0 text-sm font-bold">
                    Programação de hoje
                  </h2>
                  <p className="m-0 mt-0.5 text-xs text-slate-500">Celebrações e atividades do dia</p>
                </div>
                <Link
                  to={`/${tenantSlug}/admin/calendario?date=${todayKey}`}
                  className="inline-flex h-10 items-center gap-1 text-xs font-bold text-amber-800 transition hover:text-amber-900"
                >
                  Ver agenda <ChevronRight size={15} />
                </Link>
              </div>
              {isLoading ? (
                <EventRowsSkeleton />
              ) : todayEvents.length ? (
                <div>
                  {todayEvents.slice(0, 4).map((event) => (
                    <DashboardEvent
                      key={`${event.occurrenceId}-${event.start}`}
                      event={event}
                      now={now}
                      highlighted={event.occurrenceId === highlightedId}
                      href={`/${tenantSlug}/admin/calendario?date=${toDateKey(new Date(event.start))}`}
                    />
                  ))}
                </div>
              ) : (
                <EmptyToday event={nextScheduledEvent} tenantSlug={tenantSlug} />
              )}
            </section>

            {/* Visão rápida — métricas */}
            <section
              className="mt-4 rounded-2xl border border-slate-200/70 bg-white px-4 py-4 shadow-sm md:shadow-none md:px-5"
              aria-labelledby="overview-title"
            >
              <div>
                <h2 id="overview-title" className="m-0 text-sm font-bold">
                  Visão rápida
                </h2>
                <p className="m-0 mt-0.5 text-xs text-slate-500">Conteúdo disponível para a comunidade</p>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <Metric
                  href={`/${tenantSlug}/admin/calendario`}
                  icon={<CalendarDays size={17} />}
                  tone="bg-amber-100 text-amber-800"
                  value={metricValue(eventsQuery, events.length)}
                  label={eventsQuery.isError ? "Indisponível" : "Próximos 7 dias"}
                  sublabel="Eventos"
                />
                <Metric
                  href={`/${tenantSlug}/admin/igrejas`}
                  icon={<Building2 size={17} />}
                  tone="bg-sky-100 text-sky-700"
                  value={metricValue(churchesQuery, churchesQuery.data?.length ?? 0)}
                  label={churchesQuery.isError ? "Indisponível" : "Cadastradas"}
                  sublabel="Igrejas"
                />
                <Metric
                  href={`/${tenantSlug}/links`}
                  icon={<Link2 size={17} />}
                  tone="bg-emerald-100 text-emerald-700"
                  value={metricValue(linksQuery, linksQuery.data?.length ?? 0)}
                  label={linksQuery.isError ? "Indisponível" : "Publicados"}
                  sublabel="Links"
                />
              </div>
            </section>
          </div>

          {/* Coluna direita — pendências + tarefas rápidas */}
          <aside className="min-w-0">
            {/* Pendências */}
            <section
              className="mt-4 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm md:mt-0 md:shadow-none"
              aria-labelledby="pending-title"
            >
              <div className="px-4 pb-2 pt-4 md:px-5">
                <h2 id="pending-title" className="m-0 text-sm font-bold">
                  Pendências
                </h2>
                <p className="m-0 mt-0.5 text-xs text-slate-500">Itens que afetam a publicação</p>
              </div>
              {tenantQuery.isLoading || eventsQuery.isLoading || churchesQuery.isLoading ? (
                <div className="border-t border-slate-100 px-4 py-5 text-sm text-slate-400 md:px-5">
                  Verificando informações...
                </div>
              ) : pendingItems.length ? (
                <div>
                  {pendingItems.slice(0, 4).map((item) => (
                    <PendingLink key={item.label} item={item} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-4 md:px-5">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={17} />
                  </span>
                  <span>
                    <strong className="block text-sm">Tudo atualizado</strong>
                    <small className="text-xs text-slate-500">Nenhuma pendência encontrada</small>
                  </span>
                </div>
              )}
            </section>

            {/* Tarefas rápidas */}
            <section
              className="mt-4 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm md:shadow-none"
              aria-labelledby="quick-actions-title"
            >
              <div className="px-4 pb-2 pt-4 md:px-5">
                <h2 id="quick-actions-title" className="m-0 text-sm font-bold">
                  Tarefas rápidas
                </h2>
                <p className="m-0 mt-0.5 text-xs text-slate-500">Ações frequentes da administração</p>
              </div>
              <QuickLink
                href={`/${tenantSlug}/admin/paroquia`}
                icon={<ShieldCheck size={18} />}
                tone="bg-sky-50 text-sky-700"
                label="Atualizar paróquia"
                description="Identidade e contatos"
              />
              <QuickLink
                href={`/${tenantSlug}/admin/igrejas`}
                icon={<Building2 size={18} />}
                tone="bg-rose-50 text-rose-700"
                label="Cadastrar igreja"
                description="Locais da comunidade"
              />
              <QuickLink
                href={`/${tenantSlug}/admin/site/pagina-inicial`}
                icon={<Sparkles size={18} />}
                tone="bg-amber-50 text-amber-800"
                label="Gerenciar site público"
                description="Página inicial, destaques e canais"
              />
              <QuickLink
                href={`/${tenantSlug}/admin/horarios`}
                icon={<CalendarClock size={18} />}
                tone="bg-emerald-50 text-emerald-700"
                label="Revisar horários"
                description="Missas e atendimentos"
              />
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}

function DashboardEvent({
  event,
  now,
  highlighted,
  href,
}: {
  event: CalendarEvent;
  now: Date;
  highlighted: boolean;
  href: string;
}) {
  const happening = isEventHappeningNow(event, now);
  const finished = hasEventFinished(event, now);
  const status = highlighted ? (happening ? "Agora" : "Próximo") : null;

  return (
    <Link
      to={href}
      className={classNames(
        "grid min-h-18 grid-cols-[3.5rem_minmax(0,1fr)_1.25rem] items-center gap-3 border-t border-slate-100 px-4 py-3 transition hover:bg-stone-50 active:bg-stone-100 md:px-5",
        highlighted ? "bg-amber-50/70" : "",
        finished && !highlighted ? "opacity-55" : "",
      )}
    >
      <time dateTime={event.start} className="text-sm font-bold tabular-nums">
        {formatEventTime(event.start)}
      </time>
      <span className="min-w-0">
        <span className="flex min-w-0 items-center gap-2">
          <strong className="truncate text-sm">{event.title}</strong>
          {status ? (
            <small
              className={classNames(
                "flex-none rounded-full px-1.5 py-0.5 text-[0.55rem] font-extrabold uppercase",
                happening ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800",
              )}
            >
              {status}
            </small>
          ) : null}
        </span>
        <small className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-slate-500">
          <MapPin size={11} className="flex-none" />
          <span className="truncate">{event.location || "Local a definir"}</span>
          <span className="flex-none font-semibold text-slate-300">·</span>
          <span className="flex-none text-slate-400">{eventTypeLabels[event.type]}</span>
        </small>
      </span>
      <ChevronRight size={15} className="flex-none text-slate-300" />
    </Link>
  );
}

function NextEventHighlight({ event, tenantSlug }: { event?: CalendarEvent; tenantSlug: string }) {
  if (!event) {
    return (
      <div className="flex min-h-24 items-center gap-3 border-t border-white/10 bg-white/5 px-4 py-4 md:border-l md:border-t-0 md:px-6">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-white/10 text-slate-400">
          <CalendarDays size={19} />
        </span>
        <span>
          <small className="block text-[0.68rem] font-bold text-slate-400">Próximo na agenda</small>
          <strong className="mt-1 block text-sm text-slate-300">Nenhum evento programado</strong>
        </span>
      </div>
    );
  }

  const eventDate = new Date(event.start);
  return (
    <Link
      to={`/${tenantSlug}/admin/calendario?date=${toDateKey(eventDate)}`}
      className="group flex min-h-24 items-center gap-3 border-t border-white/10 bg-white/5 px-4 py-4 transition hover:bg-white/9 active:bg-white/12 md:border-l md:border-t-0 md:px-6"
    >
      <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-amber-300 text-slate-950">
        <CalendarDays size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <small className="block text-[0.68rem] font-bold text-amber-300">Próximo na agenda</small>
        <strong className="mt-1 block truncate text-sm text-white">{event.title}</strong>
        <small className="mt-0.5 block truncate text-xs text-slate-300">
          <span className="capitalize">{shortDate.format(eventDate)}</span>
          {" · "}
          {formatEventTime(event.start)}
          {event.location ? ` · ${event.location}` : ""}
        </small>
      </span>
      <ChevronRight
        size={17}
        className="flex-none text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-white"
      />
    </Link>
  );
}

function EmptyToday({ event, tenantSlug }: { event?: CalendarEvent; tenantSlug: string }) {
  if (!event) {
    return (
      <div className="border-t border-slate-100 px-4 py-8 text-center md:px-5">
        <CalendarDays className="mx-auto text-slate-200" size={28} />
        <p className="m-0 mt-3 text-sm font-semibold text-slate-600">Dia sem eventos</p>
        <p className="m-0 mt-1 text-xs text-slate-400">Nenhuma programação nos próximos dias.</p>
      </div>
    );
  }
  return (
    <Link
      to={`/${tenantSlug}/admin/calendario?date=${toDateKey(new Date(event.start))}`}
      className="flex items-center gap-3 border-t border-slate-100 px-4 py-4 transition hover:bg-stone-50 md:px-5"
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-800">
        <CalendarDays size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <small className="block text-[0.62rem] font-bold uppercase text-slate-400 first-letter:uppercase">
          {shortDate.format(new Date(event.start))}
        </small>
        <strong className="mt-0.5 block truncate text-sm">
          {formatEventTime(event.start)} · {event.title}
        </strong>
      </span>
      <ChevronRight size={16} className="text-slate-300" />
    </Link>
  );
}

function Metric({
  href,
  icon,
  tone,
  value,
  label,
  sublabel,
}: {
  href: string;
  icon: ReactNode;
  tone: string;
  value: string;
  label: string;
  sublabel: string;
}) {
  return (
    <Link
      to={href}
      className="flex min-h-22 min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl bg-stone-50 px-2 py-3.5 text-center transition hover:bg-stone-100 active:scale-[0.98]"
    >
      <span className={`grid h-8 w-8 place-items-center rounded-lg ${tone}`}>{icon}</span>
      <strong className="text-lg font-bold leading-none">{value}</strong>
      <span className="block text-[0.65rem] font-semibold leading-tight text-slate-500">{sublabel}</span>
      <span className="block text-[0.6rem] leading-tight text-slate-400">{label}</span>
    </Link>
  );
}

function PendingLink({ item }: { item: PendingItem }) {
  return (
    <Link
      to={item.href}
      className="flex min-h-17 items-center gap-3 border-t border-slate-100 px-4 py-3 transition hover:bg-stone-50 active:bg-stone-100 md:px-5"
    >
      <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-amber-50 text-amber-700">
        <AlertCircle size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-sm">{item.label}</strong>
        <small className="mt-0.5 block truncate text-xs text-slate-500">{item.description}</small>
      </span>
      <ChevronRight size={16} className="flex-none text-slate-300" />
    </Link>
  );
}

function QuickLink({
  href,
  icon,
  tone,
  label,
  description,
}: {
  href: string;
  icon: ReactNode;
  tone: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      to={href}
      className="flex min-h-17 items-center gap-3 border-t border-slate-100 px-4 py-3 transition hover:bg-stone-50 active:bg-stone-100 md:px-5"
    >
      <span className={`grid h-10 w-10 flex-none place-items-center rounded-xl ${tone}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <strong className="block text-sm">{label}</strong>
        <small className="mt-0.5 block truncate text-xs text-slate-500">{description}</small>
      </span>
      <ChevronRight size={16} className="flex-none text-slate-300" />
    </Link>
  );
}

function metricValue(query: { isLoading: boolean; isError: boolean }, count: number) {
  if (query.isLoading) return "–";
  if (query.isError) return "!";
  return String(count);
}

function getTodayStatus(events: CalendarEvent[], now: Date) {
  const happening = events.find((event) => isEventHappeningNow(event, now));
  if (happening) return `${happening.title} acontecendo agora`;
  const remaining = events.filter((event) => !hasEventFinished(event, now)).length;
  if (remaining) return `${remaining} ${remaining === 1 ? "evento restante" : "eventos restantes"} hoje`;
  if (events.length) return `${events.length} ${events.length === 1 ? "evento concluído" : "eventos concluídos"} hoje`;
  return "Agenda livre hoje";
}

function getPendingItems(
  tenantSlug: string,
  tenant?: Awaited<ReturnType<typeof getTenant>>,
  events?: CalendarEvent[],
  churches?: Awaited<ReturnType<typeof getTenantChurches>>,
): PendingItem[] {
  const items: PendingItem[] = [];
  if (tenant && !tenant.telefone && !tenant.contato)
    items.push({ label: "Contato não informado", description: "Adicione um canal para os fiéis", href: `/${tenantSlug}/admin/paroquia` });
  if (tenant && !tenant.endereco)
    items.push({ label: "Endereço incompleto", description: "Revise os dados institucionais", href: `/${tenantSlug}/admin/paroquia` });
  if (tenant && !tenant.homeHeader?.imageUrl)
    items.push({ label: "Imagem principal ausente", description: "A página pública está sem imagem", href: `/${tenantSlug}/admin/paroquia` });
  const eventsWithoutLocation = events?.filter((event) => !event.location?.trim()).length ?? 0;
  if (eventsWithoutLocation)
    items.push({
      label: `${eventsWithoutLocation} ${eventsWithoutLocation === 1 ? "evento sem local" : "eventos sem local"}`,
      description: "Informe onde a atividade acontece",
      href: `/${tenantSlug}/admin/calendario`,
    });
  const churchesWithoutImage = churches?.filter((church) => !church.urlImg?.trim()).length ?? 0;
  if (churchesWithoutImage)
    items.push({
      label: `${churchesWithoutImage} ${churchesWithoutImage === 1 ? "igreja sem imagem" : "igrejas sem imagem"}`,
      description: "Complete a apresentação dos locais",
      href: `/${tenantSlug}/admin/igrejas`,
    });
  return items;
}

function EventRowsSkeleton() {
  return (
    <div className="animate-pulse border-t border-slate-100">
      {[0, 1, 2].map((item) => (
        <div key={item} className="grid min-h-18 grid-cols-[3.5rem_1fr] gap-3 border-b border-slate-100 px-4 py-3 md:px-5">
          <span className="h-4 w-10 self-center rounded bg-slate-100" />
          <span className="self-center">
            <span className="block h-3.5 w-1/2 rounded bg-slate-100" />
            <span className="mt-2 block h-3 w-1/3 rounded bg-slate-100" />
          </span>
        </div>
      ))}
    </div>
  );
}
