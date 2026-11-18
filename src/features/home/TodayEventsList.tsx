import { CalendarClock } from "lucide-react";
import { Link } from "react-router-dom";
import type { CalendarEvent } from "../../shared/api/events";
import { EmptyState } from "../../shared/components/PageState";
import { getEventDisplayState, hasEventFinished } from "../events/event.utils";
import { EventListItem } from "../events/EventListItem";
import { EventList } from "../events/EventList";
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

  return (
    <div>
      <EventList label="Eventos de hoje" variant="home">
        {visibleEvents.map((event) => (
          <li key={`${event.occurrenceId}-${event.start}`}>
            <EventListItem event={event} state={getEventDisplayState(event, now, highlightedOccurrenceId)} emphasized={event.occurrenceId === highlightedOccurrenceId} variant="home" href={`${agendaHref}?date=${event.start.slice(0, 10)}`} />
          </li>
        ))}
      </EventList>
      {hiddenCount > 0 ? (
        <Link
          to={agendaHref}
          className="flex min-h-12 items-center justify-center border-t border-line/70 px-4 text-sm font-semibold text-primary transition-colors hover:bg-selection/35 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
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
    <div>
      <p className="m-0 border-b border-line/70 px-4 py-3 text-sm font-medium text-muted sm:px-5">Próximo na agenda · {formatNextDate(eventDate)}</p>
      <EventListItem event={event} state="next" emphasized variant="home" href={`${agendaHref}?date=${event.start.slice(0, 10)}`} />
    </div>
  );
}

function formatNextDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).format(date).replace(/\./g, "");
}
