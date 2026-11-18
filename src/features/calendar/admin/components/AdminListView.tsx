import type { CalendarEvent } from '../../../../shared/api/events';
import { getMonthDays, isSameDay, toDateKey } from '../../calendar.utils';
import { selectedDayClass } from '../calendarAdmin.constants';
import { AdminEventList, type AdminEventListActions } from './AdminEventList';

type AdminListViewProps = AdminEventListActions & {
  /** Eventos do mês exibido, já filtrados. */
  events: CalendarEvent[];
  selectedDate: Date;
  today: Date;
  isFiltered: boolean;
  onCreate: () => void;
  onClearFilters: () => void;
};

/** Lista cronológica do mês: um grupo por data, com a data uma única vez à esquerda. */
export function AdminListView({ events, selectedDate, today, isFiltered, onCreate, onClearFilters, ...actions }: AdminListViewProps) {
  if (!events.length) return <AdminEventList {...actions} events={[]} emptyScope="month" isFiltered={isFiltered} onCreate={onCreate} onClearFilters={onClearFilters} />;

  const byDay = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = toDateKey(new Date(event.start));
    byDay.set(key, [...(byDay.get(key) ?? []), event]);
  }
  const selectedKey = toDateKey(selectedDate);
  const days = getMonthDays(selectedDate).filter(date => {
    const key = toDateKey(date);
    // O dia escolhido continua visível mesmo vazio: é onde a pessoa vai criar o próximo evento.
    return byDay.has(key) || key === selectedKey;
  });

  return <div className="agenda-day-groups">
    {days.map(date => {
      const key = toDateKey(date);
      const dayEvents = byDay.get(key) ?? [];
      const selected = key === selectedKey;
      const isToday = isSameDay(date, today);
      const headingId = `program-date-${key}`;
      return <section key={key} aria-labelledby={headingId} data-program-date={key} data-selected={selected} className="agenda-day-group grid min-w-0 scroll-mt-4 grid-cols-[3.25rem_minmax(0,1fr)] gap-x-3 border-t border-line py-2 first:border-t-0 md:grid-cols-[4.5rem_minmax(0,1fr)] md:gap-x-4">
        <h2 id={headingId} className="m-0 flex flex-col items-center pt-1.5 text-center leading-none">
          <span aria-hidden="true" className={`grid size-9 place-items-center rounded-full text-lg font-semibold tabular-nums ${selected ? selectedDayClass : 'text-ink'} ${isToday ? 'outline-2 outline-offset-1 outline-primary [outline-style:solid]' : ''}`}>{date.getDate()}</span>
          <span aria-hidden="true" className="mt-1.5 flex flex-col items-center gap-0.5 text-[11px] font-medium uppercase leading-none tracking-wide text-muted md:flex-row md:gap-1">
            <span>{date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
            <span className="hidden md:inline">·</span>
            <span>{date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span>
          </span>
          <span className="sr-only">{isToday ? 'Hoje, ' : ''}{date.toLocaleDateString('pt-BR', { dateStyle: 'full' })}</span>
        </h2>
        {dayEvents.length
          ? <AdminEventList {...actions} events={dayEvents} onCreate={onCreate} onClearFilters={onClearFilters} />
          : <div className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
            <p className="agenda-empty-day m-0 text-[15px] leading-6 text-muted">{isFiltered ? 'Nenhum evento nesta data com os filtros aplicados.' : 'Nenhum evento nesta data.'}</p>
            {isFiltered
              ? <button type="button" onClick={onClearFilters} className="min-h-11 rounded-xl px-3 font-semibold text-primary hover:bg-selection">Limpar filtros</button>
              : <button type="button" onClick={onCreate} className="min-h-11 rounded-xl border border-line px-4 text-sm font-semibold text-primary hover:bg-selection">Adicionar evento neste dia</button>}
          </div>}
      </section>;
    })}
  </div>;
}
