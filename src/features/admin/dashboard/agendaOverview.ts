import type { CalendarEvent } from "../../../shared/api/events";
import { parseWallClock, wallDateKey, wallTimeLabel } from "../../../shared/lib/parishTime";

/**
 * - now: em andamento.
 * - next: o próximo a começar (todos os que começam no mesmo horário).
 * - later: ainda vai acontecer, mas não é o próximo.
 * - finished: o horário já terminou. Não indica conclusão administrativa.
 * - allDay: cobre o dia inteiro e ainda não terminou.
 */
export type OverviewState = "now" | "next" | "later" | "finished" | "allDay";

export type OverviewEvent = {
  event: CalendarEvent;
  state: OverviewState;
  dayKey: string;
  startMs: number;
  endMs: number;
  startLabel: string;
  endLabel?: string;
  allDay: boolean;
  /** Começou em um dia anterior e ainda está em andamento. */
  carryOver: boolean;
};

export type AgendaOverview = {
  todayKey: string;
  today: OverviewEvent[];
  /** Eventos de dias seguintes. Só vem preenchido quando hoje não tem mais nada por acontecer. */
  upcoming: OverviewEvent[];
  /** Há evento em andamento, próximo ou mais tarde hoje. */
  hasPendingToday: boolean;
};

const HOUR = 60 * 60 * 1000;
const MAX_UPCOMING = 3;

type Draft = Omit<OverviewEvent, "state">;

function toDraft(event: CalendarEvent, todayKey: string): Draft | null {
  const startMs = parseWallClock(event.start);
  if (startMs === null) return null;
  const rawEnd = parseWallClock(event.end);
  const hasEnd = rawEnd !== null && rawEnd > startMs;
  // Sem término informado, assume uma hora (mesma regra da Agenda).
  const endMs = hasEnd ? rawEnd : startMs + HOUR;
  const dayKey = wallDateKey(startMs);
  const startsAtMidnight = startMs % (24 * HOUR) === 0;
  return {
    event,
    dayKey,
    startMs,
    endMs,
    startLabel: wallTimeLabel(startMs),
    endLabel: hasEnd ? wallTimeLabel(endMs) : undefined,
    allDay: hasEnd && startsAtMidnight && endMs - startMs >= 24 * HOUR - 60_000,
    carryOver: dayKey < todayKey,
  };
}

const byStart = (a: Draft, b: Draft) => a.startMs - b.startMs || a.event.title.localeCompare(b.event.title, "pt-BR");

/**
 * Organiza os eventos do Painel a partir da hora de parede. `events` deve cobrir ontem (para eventos que
 * atravessam a meia-noite) até alguns dias à frente; nada aqui consulta a base inteira.
 */
export function buildAgendaOverview(events: CalendarEvent[], nowMs: number): AgendaOverview {
  const todayKey = wallDateKey(nowMs);
  const drafts = events.map((event) => toDraft(event, todayKey)).filter((item): item is Draft => item !== null).sort(byStart);

  const todayDrafts = drafts.filter((item) => item.dayKey === todayKey || (item.carryOver && item.endMs > nowMs));
  const nextStart = todayDrafts.find((item) => !item.allDay && item.startMs > nowMs)?.startMs;
  const stateOf = (item: Draft): OverviewState => {
    if (item.endMs <= nowMs) return "finished";
    if (item.allDay) return "allDay";
    if (item.startMs <= nowMs) return "now";
    return item.startMs === nextStart ? "next" : "later";
  };
  const today = todayDrafts.map((item) => ({ ...item, state: stateOf(item) }));
  const hasPendingToday = today.some((item) => item.state === "now" || item.state === "next" || item.state === "later");

  let upcoming: OverviewEvent[] = [];
  if (!hasPendingToday) {
    const future = drafts.filter((item) => item.dayKey > todayKey).slice(0, MAX_UPCOMING);
    const firstStart = future[0]?.startMs;
    upcoming = future.map((item) => ({ ...item, state: item.startMs === firstStart ? "next" : "later" }));
  }
  return { todayKey, today, upcoming, hasPendingToday };
}

/** Quantidade de eventos de hoje em diante sem local informado. */
export function countEventsWithoutLocation(events: CalendarEvent[], todayKey: string) {
  return events.filter((event) => {
    const start = parseWallClock(event.start);
    return start !== null && wallDateKey(start) >= todayKey && !event.location?.trim();
  }).length;
}
