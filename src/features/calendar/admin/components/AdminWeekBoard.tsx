import { MapPin } from 'lucide-react';
import type { CalendarEvent } from '../../../../shared/api/events';
import { formatEventTime } from '../../../events/event.utils';
import { getEventsForDate, getWeekDays, isSameDay, toDateKey } from '../../calendar.utils';
import { eventTypeDotClass, eventTypeLabels, selectedDayClass } from '../calendarAdmin.constants';
import { getEventTiming, getEventTitle } from '../eventPresentation';

type AdminWeekBoardProps = {
  events: CalendarEvent[];
  selectedDate: Date;
  today: Date;
  isFiltered: boolean;
  onSelectDate: (date: Date) => void;
  onEdit: (event: CalendarEvent) => void;
};

/**
 * Sete dias lado a lado quando o contêiner comporta; em largura menor os dias se empilham,
 * sem rolagem horizontal.
 */
export function AdminWeekBoard({ events, selectedDate, today, isFiltered, onSelectDate, onEdit }: AdminWeekBoardProps) {
  return (
    <div role="region" aria-label="Programação semanal" className="agenda-week-board min-w-0 border-y border-line @4xl/admin:grid @4xl/admin:grid-cols-7 @4xl/admin:divide-x @4xl/admin:divide-line">
      {getWeekDays(selectedDate, true).map(date => {
        const dayEvents = getEventsForDate(events, date);
        const selected = isSameDay(date, selectedDate);
        const isToday = isSameDay(date, today);
        const label = date.toLocaleDateString('pt-BR', { dateStyle: 'full' });
        return (
          <section key={toDateKey(date)} aria-label={label} className={`flex min-w-0 flex-col border-b border-line last:border-b-0 @4xl/admin:border-b-0 ${isToday ? 'bg-selection/30' : ''}`}>
            <button type="button" onClick={() => onSelectDate(date)} aria-label={`Ver ${label}`} aria-pressed={selected} aria-current={isToday ? 'date' : undefined} className="flex min-h-12 w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-selection/50 motion-reduce:transition-none @4xl/admin:min-h-20 @4xl/admin:flex-col @4xl/admin:justify-center @4xl/admin:gap-1 @4xl/admin:border-b @4xl/admin:border-line @4xl/admin:text-center">
              <span className={`text-xs font-semibold uppercase tracking-wide ${isToday ? 'text-primary' : 'text-muted'}`}>{date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}{isToday ? <span className="@4xl/admin:hidden"> · Hoje</span> : null}</span>
              <span className={`grid size-8 place-items-center rounded-full text-base font-semibold tabular-nums @4xl/admin:size-9 @4xl/admin:text-lg ${selected ? selectedDayClass : 'text-ink'} ${isToday ? 'outline-2 outline-offset-1 outline-primary [outline-style:solid]' : ''}`}>{date.getDate()}</span>
              {isToday ? <span className="hidden text-xs font-semibold text-primary @4xl/admin:block">Hoje</span> : null}
            </button>
            <ol className="m-0 min-w-0 flex-1 list-none divide-y divide-line/60 p-0 @4xl/admin:min-h-72">
              {dayEvents.map((event, index) => {
                const title = getEventTitle(event);
                const { allDay, past } = getEventTiming(event);
                const time = allDay ? 'Dia inteiro' : formatEventTime(event.start);
                const location = event.location?.trim();
                return <li key={`${event.occurrenceId}-${event.start}-${index}`}>
                  <button type="button" onClick={() => onEdit(event)} aria-label={`Editar ${title}, ${time}, ${label}`} className="group flex w-full min-w-0 flex-col gap-0.5 px-3 py-2.5 text-left transition-colors hover:bg-selection/50 focus-visible:bg-selection/50 motion-reduce:transition-none">
                    <span className="flex items-center gap-1.5 text-[13px] font-semibold tabular-nums leading-5">
                      <i className={`block size-2 shrink-0 rounded-full ${eventTypeDotClass[event.type]}`} aria-hidden="true" />
                      <time dateTime={event.start} className={past ? 'text-muted' : 'text-ink'}>{time}</time>
                    </span>
                    <span className={`break-words text-sm font-semibold leading-5 [overflow-wrap:anywhere] group-hover:text-primary ${past ? 'text-muted' : 'text-ink'} ${event.title?.trim() ? '' : 'italic'}`}>{title}</span>
                    <span className="text-[13px] leading-5 text-muted">{eventTypeLabels[event.type]}</span>
                    {location
                      ? <span className="flex min-w-0 items-start gap-1 text-[13px] leading-5 text-muted"><MapPin size={13} aria-hidden="true" className="mt-[3px] shrink-0" /><span className="break-words [overflow-wrap:anywhere]">{location}</span></span>
                      : <span className="flex items-center gap-1 text-[13px] font-medium leading-5 text-warning"><MapPin size={13} aria-hidden="true" className="shrink-0" />Local a definir</span>}
                  </button>
                </li>;
              })}
              {!dayEvents.length ? <li className="px-3 py-2.5 text-[13px] leading-5 text-muted @4xl/admin:py-6 @4xl/admin:text-center">{isFiltered ? 'Sem resultados' : 'Sem eventos'}</li> : null}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
