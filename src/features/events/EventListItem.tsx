import { Link } from "react-router-dom";
import type { CalendarEvent } from "../../shared/api/events";
import type { EventDisplayState } from "./event.utils";
import { EventRowContent } from "./EventRowContent";

type Props = { event: CalendarEvent; state: EventDisplayState; emphasized?: boolean; variant?: "default" | "home" } & (
  { href: string; onSelect?: never } | { href?: never; onSelect: () => void }
);

/** One visual contract, preserving native link and button semantics. */
export function EventListItem({ event, state, href, onSelect, emphasized = false, variant = "default" }: Props) {
  const layout = variant === "home"
    ? "group grid-cols-[3.75rem_minmax(0,1fr)_1.125rem] items-start gap-3 px-4 py-3 sm:gap-4 sm:px-5"
    : "grid-cols-[3.25rem_minmax(0,1fr)_1rem] items-start gap-3 rounded-xl px-3 py-4 sm:gap-4 sm:px-4";
  const emphasis = emphasized
    ? variant === "home" ? "bg-selection hover:bg-selection/80" : "bg-selection/45 hover:bg-selection/70"
    : "bg-transparent hover:bg-selection/35";
  const className = `grid min-h-22 w-full ${layout} text-left transition-colors ${emphasis} active:bg-selection/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none`;
  const content = <EventRowContent event={event} state={state} variant={variant} />;
  return href !== undefined
    ? <Link to={href} className={className}>{content}</Link>
    : <button type="button" onClick={onSelect} className={className}>{content}</button>;
}
