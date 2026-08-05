import type { CalendarEvent, CreateEventRequest } from "../shared/api/events";

type EventStore = CalendarEvent[];

export function listEventsByRange(store: EventStore, tenantSlug: string, start: string, end: string) {
  const rangeStart = new Date(`${start}T00:00:00`);
  const rangeEnd = new Date(`${end}T23:59:59`);

  return store
    .flatMap((event) => expandEvent(event, rangeStart, rangeEnd))
    .filter((event) => event.tenantSlug === tenantSlug)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

export function createMockEvent(tenantSlug: string, input: CreateEventRequest): CalendarEvent {
  const id = crypto.randomUUID();
  const start = input.start;

  return {
    id,
    sourceId: id,
    occurrenceId: buildOccurrenceId(id, start),
    tenantSlug,
    title: input.title,
    description: input.description,
    location: input.location,
    start,
    end: input.end,
    type: input.type ?? "outro",
    repeat: input.repeat ?? "none",
    repeatUntil: input.repeatUntil,
    repeatWeekdays: input.repeat === "weekly" ? (input.repeatWeekdays ?? []) : [],
    repeatMonthDay: input.repeat === "monthly" ? input.repeatMonthDay : undefined,
  };
}

export function updateMockEvent(event: CalendarEvent, input: CreateEventRequest): CalendarEvent {
  return {
    ...event,
    title: input.title,
    description: input.description,
    location: input.location,
    start: input.start,
    end: input.end,
    type: input.type ?? "outro",
    repeat: input.repeat ?? "none",
    repeatUntil: input.repeatUntil,
    repeatWeekdays: input.repeat === "weekly" ? (input.repeatWeekdays ?? []) : [],
    repeatMonthDay: input.repeat === "monthly" ? input.repeatMonthDay : undefined,
    occurrenceId: buildOccurrenceId(event.id, input.start),
  };
}

function expandEvent(event: CalendarEvent, rangeStart: Date, rangeEnd: Date) {
  if (event.repeat === "none" || !event.repeatUntil) {
    const start = new Date(event.start);
    return start >= rangeStart && start <= rangeEnd ? [event] : [];
  }

  const occurrences: CalendarEvent[] = [];
  const originalStart = new Date(event.start);
  const repeatUntil = new Date(`${event.repeatUntil}T23:59:59`);
  const cursor = new Date(Math.max(rangeStart.getTime(), startOfDay(originalStart).getTime()));
  const lastDay = new Date(Math.min(rangeEnd.getTime(), repeatUntil.getTime()));
  const durationMs = event.end ? new Date(event.end).getTime() - originalStart.getTime() : 0;

  while (cursor <= lastDay) {
    if (matchesDate(event, cursor)) {
      const occurrenceStart = new Date(cursor);
      occurrenceStart.setHours(originalStart.getHours(), originalStart.getMinutes(), originalStart.getSeconds(), 0);

      if (occurrenceStart >= originalStart && occurrenceStart >= rangeStart && occurrenceStart <= rangeEnd) {
        const occurrenceEnd = durationMs > 0 ? new Date(occurrenceStart.getTime() + durationMs) : undefined;
        occurrences.push({
          ...event,
          start: toLocalIso(occurrenceStart),
          end: occurrenceEnd ? toLocalIso(occurrenceEnd) : event.end,
          occurrenceId: buildOccurrenceId(event.id, toLocalIso(occurrenceStart)),
        });
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return occurrences;
}

function matchesDate(event: CalendarEvent, date: Date) {
  if (event.repeat === "weekly") {
    const weekdays = event.repeatWeekdays.length ? event.repeatWeekdays : [new Date(event.start).getDay()];
    return weekdays.includes(date.getDay());
  }

  if (event.repeat === "monthly") {
    return date.getDate() === (event.repeatMonthDay ?? new Date(event.start).getDate());
  }

  return false;
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function buildOccurrenceId(id: string, start: string) {
  return `${id}-${start.replace(/\D/g, "").slice(0, 12)}`;
}

function toLocalIso(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}:${pad(date.getSeconds())}`;
}
