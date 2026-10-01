import { CalendarClock, ChevronRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import type { CalendarEvent } from "../../shared/api/events";
import { EmptyState } from "../../shared/components/PageState";
import { TimelineEventos } from "../calendar/components/TimelineEventos";
import { hasEventFinished } from "../events/event.utils";
import { useNow } from "../events/useNow";

const MAX_HOME_EVENTS = 3;

export function TodayEventsList({ events, nextEvent, agendaHref }: { events: CalendarEvent[]; nextEvent?: CalendarEvent; agendaHref: string }) {
  const now = useNow();

  if (!events.length) {
    if (nextEvent) return <NextEventLink event={nextEvent} agendaHref={agendaHref} />;
    return (
      <EmptyState
        icon={<CalendarClock size={20} />}
        title="Nada agendado para hoje"
        description="Nenhuma missa, encontro ou celebração cadastrada para esta data."
      />
    );
  }

  const highlightedOccurrenceId = events.find((event) => !hasEventFinished(event, now))?.occurrenceId;
  const firstActiveIndex = events.findIndex((event) => !hasEventFinished(event, now));
  const startIndex = firstActiveIndex < 0
    ? Math.max(0, events.length - MAX_HOME_EVENTS)
    : Math.min(firstActiveIndex, Math.max(0, events.length - MAX_HOME_EVENTS));
  const visibleEvents = events.slice(startIndex, startIndex + MAX_HOME_EVENTS);
  const hiddenCount = events.length - visibleEvents.length;
  const showNextEvent = Boolean(nextEvent && events.every((event) => hasEventFinished(event, now)));

  return (
    <div>
      {showNextEvent && nextEvent ? <NextEventLink event={nextEvent} agendaHref={agendaHref} /> : null}
      <TimelineEventos
        events={visibleEvents}
        now={now}
        highlightedOccurrenceId={highlightedOccurrenceId}
        getHref={(event) => `/${event.tenantSlug}/calendario`}
        variant="home"
      />
      {hiddenCount > 0 ? (
        <Link
          to={agendaHref}
          className="mt-1 flex min-h-11 items-center justify-center rounded-xl text-xs font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/35"
        >
          Ver mais {hiddenCount} {hiddenCount === 1 ? "evento" : "eventos"}
        </Link>
      ) : null}
    </div>
  );
}

function NextEventLink({ event, agendaHref }: { event: CalendarEvent; agendaHref: string }) {
  const eventDate = new Date(event.start);
  return (
    <Link
      to={`${agendaHref}?date=${event.start.slice(0, 10)}`}
      className="mb-3 grid min-h-[4.75rem] grid-cols-[2.75rem_minmax(0,1fr)_1rem] items-center gap-3 rounded-[1.15rem] border border-slate-800 bg-slate-950 px-3 py-3 text-white shadow-[0_8px_22px_rgb(15_23_42/0.12)] transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
    >
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-amber-300 text-slate-950"><CalendarClock size={18} /></span>
      <span className="min-w-0">
        <small className="block text-[0.65rem] font-bold text-amber-300">Próximo na agenda</small>
        <strong className="mt-0.5 block truncate text-sm">{event.title}</strong>
        <small className="mt-1 flex min-w-0 items-center gap-1 text-xs text-slate-300"><MapPin size={12} className="flex-none" /><span className="truncate">{formatNextDate(eventDate)} · {event.location || "Local a confirmar"}</span></small>
      </span>
      <ChevronRight size={16} className="text-slate-400" />
    </Link>
  );
}

function formatNextDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date).replace(/\./g, "");
}
