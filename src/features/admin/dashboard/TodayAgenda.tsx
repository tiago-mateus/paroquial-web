import { CalendarDays, ChevronRight, MapPin } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { classNames } from "../../../shared/lib/classNames";
import { formatWallDate, shiftDateKey } from "../../../shared/lib/parishTime";
import { buttonClasses } from "../../../shared/styles/controls";
import type { AgendaOverview, OverviewEvent, OverviewState } from "./agendaOverview";

const MAX_ROWS = 8;
/** Acima disso, com algo ainda por vir hoje, os eventos encerrados saem do caminho. */
const COLLAPSE_FINISHED_ABOVE = 2;

type Props = {
  overview: AgendaOverview;
  /** Hora de parede atual, para o rótulo do dia. */
  wallNowMs: number;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  agendaHref: string;
  /** Prefixo das rotas administrativas, para abrir a Agenda no dia certo. */
  base: string;
  upcomingDays: number;
};

const stateText: Record<OverviewState, string> = { now: "Agora", next: "Próximo", later: "Mais tarde", finished: "Encerrado", allDay: "Dia inteiro" };

export function TodayAgenda({ overview, wallNowMs, loading, error, onRetry, agendaHref, base, upcomingDays }: Props) {
  const [showFinished, setShowFinished] = useState(false);
  const { today, upcoming, hasPendingToday, todayKey } = overview;
  const finished = today.filter((item) => item.state === "finished");
  const collapsible = hasPendingToday && finished.length > COLLAPSE_FINISHED_ABOVE;
  const visibleToday = collapsible && !showFinished ? today.filter((item) => item.state !== "finished") : today;
  const rows = visibleToday.slice(0, MAX_ROWS);
  const hidden = visibleToday.length - rows.length;
  const hrefFor = (item: OverviewEvent) => `${base}/calendario?date=${item.dayKey}`;

  return <section aria-labelledby="today-title" className="min-w-0">
    <div className="flex items-baseline justify-between gap-x-4 border-b border-line pb-3">
      <div className="flex min-w-0 items-baseline gap-x-3">
        <h2 id="today-title" className="m-0 font-display text-xl font-medium leading-7 text-ink">Hoje</h2>
        <span className="min-w-0 truncate text-sm text-muted first-letter:uppercase">
          <span className="sm:hidden">{formatWallDate(wallNowMs, { weekday: "short", day: "numeric", month: "short" }).replace(/\./g, "").replace(" de ", " ")}</span>
          <span className="hidden sm:inline">{formatWallDate(wallNowMs, { weekday: "long", day: "numeric", month: "long" })}</span>
        </span>
      </div>
      <Link to={agendaHref} className={`${buttonClasses.ghost.sm} -mr-3`}>Ver agenda<ChevronRight size={16} aria-hidden="true" /></Link>
    </div>

    {loading ? <RowsSkeleton /> : error ? <div role="alert" className="py-6">
      <p className="m-0 text-sm leading-6 text-muted">Não foi possível carregar a programação.</p>
      <button type="button" onClick={onRetry} className={`${buttonClasses.secondary.md} mt-3`}>Tentar novamente</button>
    </div> : <>
      {today.length ? <>
        {collapsible ? <button type="button" aria-expanded={showFinished} onClick={() => setShowFinished((value) => !value)} className="mt-1 flex min-h-11 w-full items-center gap-2 rounded-lg px-1 text-left text-sm text-muted hover:bg-selection/40 hover:text-ink">
          <ChevronRight size={16} aria-hidden="true" className={classNames("transition-transform motion-reduce:transition-none", showFinished && "rotate-90")} />
          {showFinished ? "Ocultar encerrados" : `${finished.length} ${finished.length === 1 ? "evento encerrado" : "eventos encerrados"}`}
        </button> : null}
        <ul aria-label="Programação de hoje" className="m-0 list-none divide-y divide-line/70 p-0">
          {rows.map((item) => <AgendaRow key={`${item.event.occurrenceId}-${item.event.start}`} item={item} href={hrefFor(item)} />)}
        </ul>
        {hidden > 0 ? <Link to={agendaHref} className={`${buttonClasses.ghost.md} mt-1 w-full justify-start px-1`}>Ver todos os {visibleToday.length} eventos de hoje<ChevronRight size={16} aria-hidden="true" /></Link> : null}
        {!hasPendingToday ? <p className="m-0 mt-3 text-sm leading-6 text-muted">Os eventos de hoje já terminaram.</p> : null}
      </> : <p className="m-0 pt-4 text-[15px] leading-6 text-muted">Nenhum evento hoje.</p>}

      {upcoming.length ? <div className="mt-5">
        <h3 className="m-0 text-xs font-semibold uppercase tracking-[0.06em] text-muted">{upcoming.length === 1 ? "Próximo compromisso" : "Próximos compromissos"}</h3>
        <ul aria-label="Próximos compromissos" className="m-0 mt-1 list-none divide-y divide-line/70 p-0">
          {upcoming.map((item) => <AgendaRow key={`${item.event.occurrenceId}-${item.event.start}`} item={item} href={hrefFor(item)} dayLabel={dayLabel(item, todayKey)} />)}
        </ul>
      </div> : null}

      {!today.length && !upcoming.length ? <div className="flex flex-col items-start gap-3 py-4">
        <p className="m-0 flex items-center gap-2 text-sm leading-6 text-muted"><CalendarDays size={18} aria-hidden="true" className="shrink-0" />Nenhum compromisso nos próximos {upcomingDays} dias.</p>
      </div> : null}
    </>}
  </section>;
}

function dayLabel(item: OverviewEvent, todayKey: string) {
  if (item.dayKey === shiftDateKey(todayKey, 1)) return "Amanhã";
  return formatWallDate(item.startMs, { weekday: "short", day: "2-digit", month: "short" }).replace(/\./g, "").replace(" de ", " ");
}

function AgendaRow({ item, href, dayLabel }: { item: OverviewEvent; href: string; dayLabel?: string }) {
  const { event, state, startLabel, endLabel, allDay, carryOver } = item;
  const finished = state === "finished";
  const location = event.location?.trim();
  const title = event.title?.trim() || "Sem título";
  return <li>
    <Link to={href} className="group -mx-2 grid min-h-16 grid-cols-[5.75rem_minmax(0,1fr)_auto] items-start gap-x-3 rounded-lg px-2 py-3 transition-colors hover:bg-selection/40 motion-reduce:transition-none">
      <span className="flex flex-col tabular-nums">
        {allDay
          ? <time dateTime={event.start} className="text-[15px] font-semibold leading-6 text-ink">Dia inteiro</time>
          : <>
            <time dateTime={event.start} className={classNames("text-[15px] font-semibold leading-6", finished ? "text-muted" : "text-ink")}>{carryOver ? "Desde ontem" : startLabel}</time>
            {endLabel ? <span className="text-[13px] leading-5 text-muted">até {endLabel}</span> : null}
          </>}
        {dayLabel ? <span className="text-[13px] leading-5 text-muted first-letter:uppercase">{dayLabel}</span> : null}
      </span>
      <span className="min-w-0">
        <strong className={classNames("block text-base font-semibold leading-6 [overflow-wrap:anywhere] group-hover:text-primary", finished ? "text-muted" : "text-ink")}>{title}</strong>
        <span className="mt-0.5 flex min-w-0 items-start gap-1 text-[13px] leading-5 [overflow-wrap:anywhere]">
          {location
            ? <><MapPin size={13} aria-hidden="true" className="mt-[3px] shrink-0 text-muted" /><span className="text-muted">{location}</span></>
            : <><MapPin size={13} aria-hidden="true" className="mt-[3px] shrink-0 text-warning" /><span className="font-medium text-warning">Local a definir</span></>}
        </span>
      </span>
      <span className="flex items-center gap-1 self-start pt-0.5">
        <StateBadge state={state} />
        <ChevronRight size={16} aria-hidden="true" className="text-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
      </span>
    </Link>
  </li>;
}

/** O estado sempre tem texto; a cor só reforça. "Mais tarde" e "Dia inteiro" ficam só para leitores de tela. */
function StateBadge({ state }: { state: OverviewState }) {
  if (state === "now") return <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-ink"><span aria-hidden="true" className="size-1.5 rounded-full bg-accent-ink" />{stateText.now}</span>;
  if (state === "next") return <span className="inline-flex items-center rounded-full bg-selection px-2.5 py-0.5 text-xs font-semibold text-primary">{stateText.next}</span>;
  if (state === "finished") return <span className="text-xs font-medium text-muted">{stateText.finished}</span>;
  return <span className="sr-only">{stateText[state]}</span>;
}

function RowsSkeleton() {
  return <div role="status" aria-label="Carregando programação" className="animate-pulse divide-y divide-line/70 motion-reduce:animate-none">
    {[0, 1, 2].map((item) => <div key={item} className="grid min-h-16 grid-cols-[5.75rem_1fr] gap-3 py-3"><span className="h-4 w-12 rounded bg-selection" /><span><span className="block h-4 w-2/3 rounded bg-selection" /><span className="mt-2 block h-3 w-1/3 rounded bg-selection" /></span></div>)}
  </div>;
}
