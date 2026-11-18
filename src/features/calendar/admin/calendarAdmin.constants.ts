import type { EventType } from '../../../shared/api/events';

export const eventTypeLabels: Record<EventType, string> = {
  missa: 'Missa',
  novena: 'Novena',
  reuniao: 'Reunião',
  encontro: 'Encontro',
  adoracao: 'Adoração',
  movimento: 'Movimento',
  outro: 'Evento',
};

export const eventTypeOptions = Object.entries(eventTypeLabels) as Array<[EventType, string]>;

/** Cor do marcador de cada tipo, para varrer a lista com os olhos. */
export const eventTypeDotClass: Record<EventType, string> = {
  // Tokens do tema quando existem; os demais são tons sóbrios que não lembram estados de erro.
  missa: 'bg-primary',
  novena: 'bg-warning',
  reuniao: 'bg-sky-700',
  encontro: 'bg-violet-600',
  adoracao: 'bg-accent',
  movimento: 'bg-teal-600',
  outro: 'bg-control-border',
};

/**
 * Dia selecionado: preenchimento âmbar + anel escuro. O anel dá o contraste de componente (≥3:1)
 * que o âmbar sozinho não tem sobre o fundo (1,46:1); "hoje" continua sendo o contorno verde.
 */
export const selectedDayClass = 'bg-accent text-accent-ink ring-1 ring-inset ring-accent-ink/70';

/** Modos de visualização da Agenda. O valor também é o que vai para `?view=` na URL. */
export type CalendarViewMode = 'month' | 'week' | 'list';
export const calendarViewOptions: ReadonlyArray<readonly [CalendarViewMode, string]> = [
  ['month', 'Mês'],
  ['week', 'Semana'],
  ['list', 'Lista'],
];
export const defaultCalendarView: CalendarViewMode = 'list';

export function parseCalendarView(value: string | null): CalendarViewMode {
  return calendarViewOptions.some(([mode]) => mode === value) ? (value as CalendarViewMode) : defaultCalendarView;
}
