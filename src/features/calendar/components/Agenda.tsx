import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { type KeyboardEvent, useMemo, useRef } from 'react';
import { classNames } from '../../../shared/lib/classNames';
import type { CalendarEvent } from '../../../shared/api/events';
import { addDays, formatMonth, getMonthDays, getWeekDays, isSameDay, toDateKey } from '../calendar.utils';
import { CalendarDateCell } from './CalendarDateCell';

const weekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const accessibleDateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' });
const SWIPE_THRESHOLD_PX = 42;

export type AgendaView = 'week' | 'month';

type AgendaProps = {
  events: CalendarEvent[];
  selectedDate: Date;
  view: AgendaView;
  onSelectDate: (date: Date) => void;
  onViewChange?: (view: AgendaView) => void;
  className?: string;
};

export function Agenda({
  events,
  selectedDate,
  view,
  onSelectDate,
  onViewChange,
  className,
}: AgendaProps) {
  const eventCounts = useMemo(
    () =>
      events.reduce((counts, event) => {
        const key = toDateKey(new Date(event.start));
        counts.set(key, (counts.get(key) ?? 0) + 1);
        return counts;
      }, new Map<string, number>()),
    [events],
  );
  const today = useMemo(() => new Date(), []);
  const pointerStartX = useRef<number | null>(null);
  const suppressDateClick = useRef(false);

  function handleWeekKeyDown(event: KeyboardEvent<HTMLButtonElement>, date: Date) {
    let target: Date | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') target = addDays(date, 1);
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') target = addDays(date, -1);
    if (!target) return;
    event.preventDefault();
    onSelectDate(target);
  }

  function changePeriod(amount: number) {
    if (view === 'week') {
      onSelectDate(addDays(selectedDate, amount * 7));
      return;
    }

    const targetYear = selectedDate.getFullYear();
    const targetMonth = selectedDate.getMonth() + amount;
    const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
    onSelectDate(new Date(targetYear, targetMonth, Math.min(selectedDate.getDate(), lastDay)));
  }

  function selectDate(date: Date) {
    if (suppressDateClick.current) return;
    onSelectDate(date);
  }

  const days =
    view === 'week'
      ? getWeekDays(selectedDate)
      : getMonthDays(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const leading = view === 'month' ? Array.from({ length: days[0]?.getDay() ?? 0 }) : [];

  return (
    <div
      className={classNames(
        'w-full min-w-0 max-w-full overflow-hidden bg-white',
        'md:rounded-[1.5rem] md:border md:border-slate-200/80 md:p-4',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-1.5 py-1 md:mb-3 md:px-0 md:pb-3 md:pt-0">
        <button type="button" onClick={() => changePeriod(-1)} aria-label={view === 'week' ? 'Semana anterior' : 'Mês anterior'} className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"><ChevronLeft size={17} /></button>
        <strong className="text-sm font-bold tracking-[-0.01em] text-slate-800" aria-live="polite">{formatMonth(selectedDate)}</strong>
        <button type="button" onClick={() => changePeriod(1)} aria-label={view === 'week' ? 'Próxima semana' : 'Próximo mês'} className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"><ChevronRight size={17} /></button>
      </div>
      <div className={classNames('grid grid-cols-7', view === 'month' ? 'gap-px md:gap-1' : 'gap-1')} aria-hidden="true">
        {weekdayLabels.map((label) => (
          <span
            key={label}
            className="py-1 text-center text-[0.58rem] font-bold uppercase tracking-[0.04em] text-slate-400 md:py-1.5 md:text-[0.6rem] md:tracking-[0.06em]"
          >
            {label}
          </span>
        ))}
      </div>
      <div
        className={classNames(
          'touch-pan-y overflow-hidden transition-[max-height] duration-300 ease-out motion-reduce:transition-none',
          view === 'month' ? 'max-h-[30rem]' : 'max-h-12 md:max-h-[4.25rem]',
        )}
        onPointerDown={(event) => {
          if (view === 'week') pointerStartX.current = event.clientX;
        }}
        onPointerCancel={() => {
          pointerStartX.current = null;
        }}
        onPointerUp={(event) => {
          if (view !== 'week' || pointerStartX.current === null) return;
          const deltaX = event.clientX - pointerStartX.current;
          pointerStartX.current = null;
          if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
          suppressDateClick.current = true;
          onSelectDate(addDays(selectedDate, deltaX > 0 ? -7 : 7));
          window.setTimeout(() => {
            suppressDateClick.current = false;
          }, 0);
        }}
      >
        <div
          className={classNames('grid grid-cols-7 bg-white', view === 'month' ? 'gap-px md:gap-1' : 'gap-1')}
          role={view === 'month' ? 'grid' : 'listbox'}
          aria-label={view === 'month' ? 'Calendário mensal' : 'Dias da semana'}
          aria-orientation={view === 'week' ? 'horizontal' : undefined}
        >
          {leading.map((_, index) => (
            <span key={`empty-${index}`} className="bg-white" aria-hidden="true" />
          ))}
          {days.map((date) => {
            const key = toDateKey(date);
            const selected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, today);
            const count = eventCounts.get(key) ?? 0;
            return (
              <CalendarDateCell
                key={key}
                date={date}
                selected={selected}
                today={isToday}
                eventCount={count}
                compact={view === 'month'}
                role={view === 'month' ? 'gridcell' : 'option'}
                tabIndex={view === 'week' && selected ? 0 : -1}
                ariaLabel={`${accessibleDateFormatter.format(date)}, ${count ? `${count} eventos` : 'sem eventos'}`}
                onClick={() => selectDate(date)}
                onKeyDown={view === 'week' ? (event) => handleWeekKeyDown(event, date) : undefined}
              />
            );
          })}
        </div>
      </div>
      {onViewChange ? (
        <button
          type="button"
          onClick={() => onViewChange(view === 'month' ? 'week' : 'month')}
          aria-expanded={view === 'month'}
          className="flex h-10 w-full items-center justify-center gap-1.5 border-t border-slate-100 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500/35 motion-reduce:transition-none md:hidden"
        >
          {view === 'month' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {view === 'month' ? 'Recolher' : 'Ver mês completo'}
        </button>
      ) : null}
    </div>
  );
}
