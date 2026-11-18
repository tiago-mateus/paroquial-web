import type { CalendarEvent } from '../../../shared/api/events';
import { formatMonth, getWeekDays } from '../calendar.utils';
import type { CalendarViewMode } from './calendarAdmin.constants';

const MINUTE = 60 * 1000;

/** Título para exibição: evento sem título nunca deixa a linha vazia. */
export function getEventTitle(event: CalendarEvent) {
  return event.title?.trim() || 'Sem título';
}

/**
 * Leitura de horários compartilhada pelas três visualizações.
 * O modelo não tem campo "dia inteiro": só tratamos como tal o evento que cobre o dia
 * (começa à meia-noite e termina às 23:59 ou à meia-noite seguinte). Só afeta a exibição.
 */
export function getEventTiming(event: CalendarEvent, now = Date.now()) {
  const start = new Date(event.start);
  const rawEnd = event.end ? new Date(event.end) : undefined;
  const validStart = Number.isFinite(start.getTime());
  const end = rawEnd && validStart && rawEnd.getTime() > start.getTime() ? rawEnd : undefined;
  const endsAnotherDay = Boolean(end && end.toDateString() !== start.toDateString());
  const allDay = Boolean(
    validStart && end && start.getHours() === 0 && start.getMinutes() === 0
      && (end.getTime() - start.getTime() >= 24 * 60 * MINUTE - MINUTE),
  );
  const startMs = start.getTime();
  const endMs = (end ?? new Date(startMs + 60 * MINUTE)).getTime();
  return { start, end, endsAnotherDay, allDay, ongoing: startMs <= now && now < endMs, past: endMs <= now };
}

const shortDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' });
const longMonthDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' });

function stripDot(value: string) {
  return value.replace(/\./g, '');
}

/** Texto do período mostrado, de acordo com o modo ativo. */
export function formatPeriodLabel(view: CalendarViewMode, date: Date) {
  if (view !== 'week') return formatMonth(date);
  const days = getWeekDays(date, true);
  const first = days[0];
  const last = days[6];
  if (first.getFullYear() !== last.getFullYear()) {
    return `${stripDot(shortDate.format(first))} de ${first.getFullYear()} – ${stripDot(shortDate.format(last))} de ${last.getFullYear()}`;
  }
  if (first.getMonth() !== last.getMonth()) {
    return `${stripDot(shortDate.format(first))} – ${stripDot(shortDate.format(last))} de ${last.getFullYear()}`;
  }
  return `${first.getDate()} – ${longMonthDate.format(last)} de ${last.getFullYear()}`;
}
