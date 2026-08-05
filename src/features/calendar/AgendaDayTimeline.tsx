import { CalendarX2 } from "lucide-react";
import type { CalendarEvent } from "../../shared/api/events";
import { EmptyState } from "../../shared/components/PageState";
import { TimelineEventos } from "./components/TimelineEventos";
import { hasEventFinished } from "../events/event.utils";
import { useNow } from "../events/useNow";

export function AgendaDayTimeline({ events, onSelect }: { events: CalendarEvent[]; onSelect: (event: CalendarEvent) => void }) {
  const now = useNow();

  if (!events.length) {
    return (
      <EmptyState
        icon={<CalendarX2 size={20} />}
        title="Sem eventos neste dia"
        description="Nenhuma missa, encontro ou celebração cadastrada para esta data."
        className="grid min-h-40 place-content-center rounded-[1.25rem] border-slate-100 px-6 py-7 shadow-[0_5px_20px_rgb(15_23_42/0.025)] [&>span:first-child]:mx-auto"
      />
    );
  }

  const highlightedOccurrenceId = events.find((event) => !hasEventFinished(event, now))?.occurrenceId;

  return (
    <TimelineEventos
      events={events}
      now={now}
      highlightedOccurrenceId={highlightedOccurrenceId}
      onSelect={onSelect}
    />
  );
}
