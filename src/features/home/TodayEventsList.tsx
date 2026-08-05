import { CalendarClock } from "lucide-react";
import { Link } from "react-router-dom";
import type { CalendarEvent } from "../../shared/api/events";
import { EmptyState } from "../../shared/components/PageState";
import { TimelineEventos } from "../calendar/components/TimelineEventos";
import { hasEventFinished } from "../events/event.utils";
import { useNow } from "../events/useNow";

const MAX_HOME_EVENTS = 3;

export function TodayEventsList({ events, agendaHref }: { events: CalendarEvent[]; agendaHref: string }) {
  const now = useNow();

  if (!events.length) {
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

  return (
    <div>
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
