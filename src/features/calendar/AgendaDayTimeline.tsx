import { CalendarX2 } from "lucide-react";
import type { CalendarEvent } from "../../shared/api/events";
import { EmptyState } from "../../shared/components/PageState";
import { getEventDisplayState, hasEventFinished } from "../events/event.utils";
import { EventListItem } from "../events/EventListItem";
import { EventList } from "../events/EventList";
import { useNow } from "../events/useNow";

export function AgendaDayTimeline({ events, onSelect }: { events: CalendarEvent[]; onSelect: (event: CalendarEvent) => void }) {
  const now = useNow();

  if (!events.length) {
    return (
      <EmptyState
        icon={<CalendarX2 size={20} />}
        title="Sem eventos neste dia"
        description="Nenhuma missa, encontro ou celebração cadastrada para esta data."
        className="grid min-h-48 place-content-center rounded-xl border border-line bg-surface px-6 py-7 [&>span:first-child]:mx-auto"
      />
    );
  }

  const highlightedOccurrenceId = events.find((event) => !hasEventFinished(event, now))?.occurrenceId;

  return (
    <EventList>
      {events.map((event) => (
        <li key={event.occurrenceId}>
          <EventListItem event={event} state={getEventDisplayState(event, now, highlightedOccurrenceId)} onSelect={() => onSelect(event)} />
        </li>
      ))}
    </EventList>
  );
}
