import { ChevronRight } from "lucide-react";
import type { CalendarEvent } from "../../shared/api/events";
import { formatEventTime, type EventDisplayState } from "./event.utils";

type Props = { event: CalendarEvent; state: EventDisplayState; variant?: "default" | "home" };

/** Shared content; callers keep the correct link or button interaction. */
export function EventRowContent({ event, state, variant = "default" }: Props) {
  const finished = state === "finished";
  const highlighted = state === "next" || state === "happening";
  const status = state === "happening" ? "Acontecendo agora" : state === "next" ? "Próximo evento" : finished ? "Encerrado" : null;
  if (variant === "home") {
    return <>
      <time dateTime={event.start} className={`self-start rounded-lg py-1 text-center text-base leading-6 font-bold tabular-nums ${highlighted ? "bg-primary text-white" : finished ? "text-muted" : "text-ink"}`}>{formatEventTime(event.start)}</time>
      <span className="min-w-0 py-1">
        <strong className="block text-base font-bold leading-6 text-ink [overflow-wrap:anywhere]">{event.title}</strong>
        <span className="mt-1 block text-sm font-medium leading-5 text-muted [overflow-wrap:anywhere]">{event.location?.trim() || "Local a confirmar"}</span>
        {status ? <span className={`mt-1 flex items-center gap-1.5 text-[13px] font-semibold leading-5 ${finished ? "text-muted" : "text-primary"}`}>
          {highlighted ? <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> : null}
          {status}
        </span> : null}
      </span>
      <ChevronRight size={17} aria-hidden="true" className="self-center text-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
    </>;
  }
  return <>
    <time dateTime={event.start} className={`rounded-lg py-1.5 text-center text-base leading-6 tabular-nums ${highlighted ? "bg-primary font-bold text-white" : finished ? "bg-selection/65 font-semibold text-primary" : "bg-selection font-semibold text-ink"}`}>{formatEventTime(event.start)}</time>
    <span className="min-w-0">
      <strong className="block text-base font-semibold leading-6 text-ink [overflow-wrap:anywhere]">{event.title}</strong>
      <span className="mt-1 block text-sm leading-5 text-muted [overflow-wrap:anywhere]">{event.location?.trim() || "Local a confirmar"}</span>
      {status ? <span className={`mt-1.5 block text-[13px] leading-5 ${finished ? "font-medium text-muted" : state === "happening" ? "font-semibold text-primary" : "font-medium text-primary"}`}>{status}</span> : null}
    </span>
    <ChevronRight size={16} aria-hidden="true" className="mt-1 text-muted" />
  </>;
}
