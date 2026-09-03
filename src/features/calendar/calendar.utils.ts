import type { CalendarEvent } from "../../shared/api/events";

export const weekdayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function toDateKey(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDateKey(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return toDateKey(date) === value ? date : null;
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

export function startOfWeek(date: Date) {
  return addDays(date, -date.getDay());
}

export function getWeekDays(date: Date) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function getMonthDays(date: Date) {
  const total = endOfMonth(date).getDate();
  return Array.from({ length: total }, (_, index) => new Date(date.getFullYear(), date.getMonth(), index + 1));
}

export function getMondayFirstOffset(date: Date) {
  return (startOfMonth(date).getDay() + 6) % 7;
}

export type MonthCell = { date: Date; adjacent: boolean };

/** Retorna as células do grid mensal começando na segunda-feira,
 *  preenchendo com dias do mês anterior e próximo nas bordas. */
export function getMonthGrid(date: Date): MonthCell[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Offset seg=0 … dom=6
  const leadingCount = (firstDay.getDay() + 6) % 7;
  const trailingCount = (7 - ((leadingCount + lastDay.getDate()) % 7)) % 7;

  const leading: MonthCell[] = Array.from({ length: leadingCount }, (_, i) => ({
    date: addDays(firstDay, -(leadingCount - i)),
    adjacent: true,
  }));
  const current: MonthCell[] = Array.from({ length: lastDay.getDate() }, (_, i) => ({
    date: new Date(year, month, i + 1),
    adjacent: false,
  }));
  const trailing: MonthCell[] = Array.from({ length: trailingCount }, (_, i) => ({
    date: addDays(lastDay, i + 1),
    adjacent: true,
  }));

  return [...leading, ...current, ...trailing];
}

export function isSameDay(first: Date, second: Date) {
  return toDateKey(first) === toDateKey(second);
}

export function formatMonth(date: Date) {
  const value = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
  return value.charAt(0).toLocaleUpperCase("pt-BR") + value.slice(1);
}

export function formatSelectedDate(date: Date) {
  const value = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  })
    .format(date)
    .replace(".", "");

  return value.charAt(0).toLocaleUpperCase("pt-BR") + value.slice(1);
}

export function getEventsForDate(events: CalendarEvent[], date: Date) {
  const key = toDateKey(date);
  return events
    .filter((event) => toDateKey(new Date(event.start)) === key)
    .sort((first, second) => new Date(first.start).getTime() - new Date(second.start).getTime());
}

export function getEventCountsByDate(events: CalendarEvent[]) {
  return events.reduce((counts, event) => {
    const key = toDateKey(new Date(event.start));
    counts.set(key, (counts.get(key) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
}
