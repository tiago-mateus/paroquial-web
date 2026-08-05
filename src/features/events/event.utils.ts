import type { CalendarEvent } from "../../shared/api/events";

export function hasEventFinished(event: CalendarEvent, now: Date) {
  const end = event.end ? new Date(event.end) : null;
  const start = new Date(event.start);

  if (end && !Number.isNaN(end.getTime())) return end.getTime() < now.getTime();
  if (Number.isNaN(start.getTime())) return true;
  return start.getTime() < now.getTime();
}

export function isEventHappeningNow(event: CalendarEvent, now: Date) {
  const start = new Date(event.start);
  const end = event.end ? new Date(event.end) : null;

  if (Number.isNaN(start.getTime()) || !end || Number.isNaN(end.getTime())) return false;
  return start.getTime() <= now.getTime() && end.getTime() >= now.getTime();
}

export function formatEventTimeRange(event: CalendarEvent) {
  return event.end
    ? `${formatEventTime(event.start)} - ${formatEventTime(event.end)}`
    : formatEventTime(event.start);
}

export function formatEventTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
