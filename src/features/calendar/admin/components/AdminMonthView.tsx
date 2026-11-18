import type { CalendarEvent } from '../../../../shared/api/events';
import { useMediaQuery } from '../../../../shared/hooks/useMediaQuery';
import { formatEventTime } from '../../../events/event.utils';
import { formatMonth, formatSelectedDate, getEventsForDate, getMonthGrid, isSameDay, startOfMonth, toDateKey, weekdayLabels } from '../../calendar.utils';
import { Agenda } from '../../components/Agenda';
import { eventTypeDotClass, selectedDayClass } from '../calendarAdmin.constants';
import { getEventTiming, getEventTitle } from '../eventPresentation';
import { AdminEventList, type AdminEventListActions } from './AdminEventList';

/** Eventos mostrados por célula antes do indicador "+ N eventos". */
const VISIBLE_PER_DAY = 3;

type AdminMonthViewProps = AdminEventListActions & {
  /** Eventos da grade do mês (inclui dias adjacentes), já filtrados. */
  events: CalendarEvent[];
  selectedDate: Date;
  today: Date;
  isFiltered: boolean;
  /** Seleciona o dia sem trocar de modo (grade compacta no mobile). */
  onSelectDay: (date: Date) => void;
  /** Abre o dia na visualização semanal. */
  onOpenDay: (date: Date) => void;
  onCreate: () => void;
  onClearFilters: () => void;
};

export function AdminMonthView(props: AdminMonthViewProps) {
  const wide = useMediaQuery('(min-width: 768px)');
  return wide ? <MonthGrid {...props} /> : <CompactMonth {...props} />;
}

function MonthGrid({ events, selectedDate, today, onEdit, onOpenDay }: AdminMonthViewProps) {
  const cells = getMonthGrid(startOfMonth(selectedDate));
  return <div className="agenda-month-grid min-w-0" role="group" aria-label={`Calendário de ${formatMonth(selectedDate).toLocaleLowerCase('pt-BR')}`}>
    <div className="grid grid-cols-7 border-b border-line" aria-hidden="true">
      {weekdayLabels.map(label => <span key={label} className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>)}
    </div>
    <div className="grid grid-cols-7 border-l border-line [grid-auto-rows:minmax(6rem,auto)]">
      {cells.map(({ date, adjacent }) => {
        const dayEvents = getEventsForDate(events, date);
        const selected = isSameDay(date, selectedDate);
        const isToday = isSameDay(date, today);
        const full = date.toLocaleDateString('pt-BR', { dateStyle: 'full' });
        const hidden = Math.max(0, dayEvents.length - VISIBLE_PER_DAY);
        return <div key={toDateKey(date)} role="group" aria-label={`${full}, ${dayEvents.length} ${dayEvents.length === 1 ? 'evento' : 'eventos'}`} data-selected={selected || undefined} className={`flex min-w-0 flex-col gap-1 border-b border-r border-line p-1.5 ${adjacent ? 'bg-line/25' : ''}`}>
          <button type="button" onClick={() => onOpenDay(date)} aria-label={`Ver ${full} na semana`} aria-current={isToday ? 'date' : undefined} className={`inline-grid size-8 shrink-0 place-items-center self-start rounded-full text-sm font-semibold tabular-nums transition-colors hover:bg-selection motion-reduce:transition-none ${selected ? `${selectedDayClass} hover:bg-accent` : adjacent ? 'text-muted' : 'text-ink'} ${isToday ? 'outline-2 outline-offset-1 outline-primary [outline-style:solid]' : ''}`}>{date.getDate()}</button>
          {dayEvents.length ? <ul className="m-0 grid min-w-0 list-none gap-0.5 p-0">
            {dayEvents.slice(0, VISIBLE_PER_DAY).map((event, index) => {
              const title = getEventTitle(event);
              const { allDay, past } = getEventTiming(event);
              const time = allDay ? '' : formatEventTime(event.start);
              return <li key={`${event.occurrenceId}-${event.start}-${index}`} className="min-w-0">
                <button type="button" onClick={() => onEdit(event)} aria-label={`Editar ${title}${time ? `, ${time}` : ', dia inteiro'}`} title={`${time ? `${time} · ` : ''}${title}`} className={`flex min-h-6 w-full min-w-0 flex-col rounded-md px-1.5 py-0.5 text-left text-xs leading-4 transition-colors hover:bg-selection motion-reduce:transition-none lg:flex-row lg:items-center lg:gap-1.5 ${past || adjacent ? 'text-muted' : 'text-ink'}`}>
                  {/* Em células estreitas (< 1024 px) horário e título ficam em duas linhas para o título não sumir. */}
                  <span className="flex shrink-0 items-center gap-1.5">
                    <i className={`block size-2 shrink-0 rounded-full ${eventTypeDotClass[event.type]}`} aria-hidden="true" />
                    {time ? <span className="font-semibold tabular-nums">{time}</span> : null}
                  </span>
                  <span className="min-w-0 truncate pl-3.5 lg:pl-0">{title}</span>
                </button>
              </li>;
            })}
          </ul> : null}
          {hidden ? <button type="button" onClick={() => onOpenDay(date)} aria-label={`Ver todos os ${dayEvents.length} eventos de ${full}`} className="min-h-6 self-start rounded-md px-1.5 text-left text-xs font-semibold text-primary hover:bg-selection">+ {hidden} {hidden === 1 ? 'evento' : 'eventos'}</button> : null}
        </div>;
      })}
    </div>
  </div>;
}

/** Telas pequenas: grade enxuta com pontos nos dias e, abaixo, os eventos do dia escolhido. */
function CompactMonth({ events, selectedDate, isFiltered, onSelectDay, onCreate, onClearFilters, ...actions }: AdminMonthViewProps) {
  const dayEvents = getEventsForDate(events, selectedDate);
  return <div className="agenda-month-compact min-w-0">
    <Agenda events={events} selectedDate={selectedDate} view="month" hideToolbar plain selectionTone="blue" onSelectDate={onSelectDay} className="border-b border-line pb-1" />
    <section aria-label={`Eventos de ${formatSelectedDate(selectedDate)}`} className="pt-3">
      <h2 className="m-0 mb-1 text-base font-semibold text-ink">{formatSelectedDate(selectedDate)} <span className="text-[13px] font-normal text-muted">· {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'}</span></h2>
      <AdminEventList {...actions} events={dayEvents} isFiltered={isFiltered} emptyScope="day" onCreate={onCreate} onClearFilters={onClearFilters} />
    </section>
  </div>;
}
