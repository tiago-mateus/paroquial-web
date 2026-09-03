import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { type KeyboardEvent, useEffect, useMemo, useRef } from 'react';
import { classNames } from '../../../shared/lib/classNames';
import type { CalendarEvent } from '../../../shared/api/events';
import {
  addDays,
  formatMonth,
  getMonthGrid,
  getWeekDays,
  isSameDay,
  toDateKey,
} from '../calendar.utils';
import { CalendarDateCell } from './CalendarDateCell';

const monthWeekdayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const weekWeekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const accessibleDateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' });
const SWIPE_THRESHOLD_PX = 42;

export type AgendaView = 'week' | 'month';

type AgendaProps = {
  events: CalendarEvent[];
  selectedDate: Date;
  view: AgendaView;
  onSelectDate: (date: Date) => void;
  onNavigateDate?: (date: Date) => void;
  onViewChange?: (view: AgendaView) => void;
  /** Exibe botão "Hoje" na toolbar (útil na sidebar desktop) */
  onToday?: () => void;
  isToday?: boolean;
  className?: string;
  hideToolbar?: boolean;
  integratedWeekLabels?: boolean;
  selectionTone?: 'slate' | 'amber';
  plain?: boolean;
};

export function Agenda({
  events,
  selectedDate,
  view,
  onSelectDate,
  onNavigateDate,
  onViewChange,
  onToday,
  isToday = false,
  className,
  hideToolbar = false,
  integratedWeekLabels = false,
  selectionTone = 'slate',
  plain = false,
}: AgendaProps) {
  const navigateDate = onNavigateDate ?? onSelectDate;
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
  const agendaRef = useRef<HTMLDivElement>(null);
  const focusSelectedAfterChange = useRef(false);

  useEffect(() => {
    if (!focusSelectedAfterChange.current) return;
    const selectedRole = view === 'week' ? 'option' : 'gridcell';
    agendaRef.current
      ?.querySelector<HTMLButtonElement>(`[role="${selectedRole}"][aria-selected="true"]`)
      ?.focus();
    focusSelectedAfterChange.current = false;
  }, [selectedDate, view]);

  function handleDateKeyDown(event: KeyboardEvent<HTMLButtonElement>, date: Date) {
    let target: Date | null = null;
    if (event.key === 'ArrowRight') target = addDays(date, 1);
    if (event.key === 'ArrowLeft') target = addDays(date, -1);
    if (event.key === 'ArrowDown') target = addDays(date, view === 'month' ? 7 : 1);
    if (event.key === 'ArrowUp') target = addDays(date, view === 'month' ? -7 : -1);
    if (!target) return;
    event.preventDefault();
    focusSelectedAfterChange.current = true;
    navigateDate(target);
  }

  function changePeriod(amount: number) {
    if (view === 'week') {
      navigateDate(addDays(selectedDate, amount * 7));
      return;
    }
    const targetYear = selectedDate.getFullYear();
    const targetMonth = selectedDate.getMonth() + amount;
    const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
    navigateDate(new Date(targetYear, targetMonth, Math.min(selectedDate.getDate(), lastDay)));
  }

  function selectDate(date: Date) {
    if (suppressDateClick.current) return;
    onSelectDate(date);
  }

  // Semana: domingo-sábado (getWeekDays parte do domingo); Mês: segunda-domingo (pt-BR)
  const weekDays = getWeekDays(selectedDate);
  const monthGrid = useMemo(
    () => getMonthGrid(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)),
    [selectedDate],
  );

  const cells = view === 'week' ? weekDays : monthGrid;

  // Mapa de dia JS (0=Dom…6=Sáb) → label seg-dom
  const weekdayLabelByDay: Record<number, string> = {
    0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb',
  };

  function renderCell(cell: Date | { date: Date; adjacent: boolean }) {
    const date = 'adjacent' in cell ? cell.date : cell;
    const adjacent = 'adjacent' in cell ? cell.adjacent : false;
    const key = `${toDateKey(date)}-${adjacent ? 'adj' : 'cur'}`;
    const selected = !adjacent && isSameDay(date, selectedDate);
    const isToday = isSameDay(date, today);
    const count = adjacent ? 0 : (eventCounts.get(toDateKey(date)) ?? 0);
    return (
      <CalendarDateCell
        key={key}
        date={date}
        selected={selected}
        today={isToday}
        eventCount={count}
        adjacent={adjacent}
        compact={view === 'month'}
        weekdayLabel={
          integratedWeekLabels && view === 'week'
            ? weekdayLabelByDay[date.getDay()]
            : undefined
        }
        selectionTone={selectionTone}
        role={view === 'month' ? 'gridcell' : 'option'}
        tabIndex={selected ? 0 : -1}
        ariaLabel={`${accessibleDateFormatter.format(date)}${adjacent ? ', mês adjacente' : ''}, ${count ? `${count} eventos` : 'sem eventos'}`}
        onClick={() => selectDate(date)}
        onKeyDown={(event) => handleDateKeyDown(event, date)}
      />
    );
  }

  return (
    <div
      ref={agendaRef}
      className={classNames(
        'w-full min-w-0 max-w-full overflow-hidden bg-white',
        plain ? '' : 'md:rounded-2xl md:border md:border-slate-200/80 md:p-4',
        className,
      )}
    >
      {/* Toolbar */}
      <div
        className={classNames(
          'items-center justify-between border-b border-slate-100 px-1.5 py-1 md:mb-3 md:px-0 md:pb-3 md:pt-0',
          hideToolbar ? 'hidden' : 'flex',
        )}
      >
        <button
          type="button"
          onClick={() => changePeriod(-1)}
          aria-label={view === 'week' ? 'Semana anterior' : 'Mês anterior'}
          className="grid h-11 w-11 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
        >
          <ChevronLeft size={17} />
        </button>

        <div className="flex min-w-0 items-center gap-2">
          <strong
            className="text-sm font-bold tracking-[-0.01em] text-slate-800"
            aria-live="polite"
          >
            {formatMonth(selectedDate)}
          </strong>
          {onToday && !isToday ? (
            <button
              type="button"
              onClick={onToday}
              className="inline-flex min-h-11 items-center rounded-lg bg-amber-50 px-2 py-1 text-[0.65rem] font-bold text-amber-800 transition hover:bg-amber-100"
            >
              Hoje
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => changePeriod(1)}
          aria-label={view === 'week' ? 'Próxima semana' : 'Próximo mês'}
          className="grid h-11 w-11 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
        >
          <ChevronRight size={17} />
        </button>
      </div>

      {/* Header de dias da semana */}
      <div
        className={classNames(
          'grid grid-cols-7 gap-1',
          integratedWeekLabels && view === 'week' ? 'hidden' : '',
          hideToolbar && view === 'month' ? 'px-3 pt-1' : '',
        )}
        aria-hidden="true"
      >
        {(view === 'month' ? monthWeekdayLabels : weekWeekdayLabels).map((label) => (
          <span
            key={label}
            className="py-1.5 text-center text-[0.68rem] font-bold uppercase tracking-[0.04em] text-slate-500 md:py-2 md:text-[0.72rem]"
          >
            {label}
          </span>
        ))}
      </div>

      {/* Grid de células */}
      <div
        className={classNames(
          'touch-pan-y overflow-hidden transition-[max-height] duration-300 ease-out motion-reduce:transition-none',
          view === 'month'
            ? 'max-h-[34rem]'
            : integratedWeekLabels
              ? 'max-h-[5.75rem]'
              : 'max-h-12 md:max-h-[4.25rem]',
        )}
        onPointerDown={(event) => {
          pointerStartX.current = event.clientX;
        }}
        onPointerCancel={() => {
          pointerStartX.current = null;
        }}
        onPointerUp={(event) => {
          if (pointerStartX.current === null) return;
          const deltaX = event.clientX - pointerStartX.current;
          pointerStartX.current = null;
          if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
          suppressDateClick.current = true;
          if (view === 'week') {
            navigateDate(addDays(selectedDate, deltaX > 0 ? -7 : 7));
          } else {
            changePeriod(deltaX > 0 ? -1 : 1);
          }
          window.setTimeout(() => {
            suppressDateClick.current = false;
          }, 0);
        }}
      >
        <div
          className={classNames(
            view === 'month' ? 'grid gap-1 bg-white' : 'grid grid-cols-7 gap-1 bg-white',
            integratedWeekLabels && view === 'week' ? 'gap-1 px-4 py-3' : '',
            hideToolbar && view === 'month' ? 'px-3 pb-3' : '',
          )}
          role={view === 'month' ? 'grid' : 'listbox'}
          aria-label={view === 'month' ? 'Calendário mensal' : 'Dias da semana'}
          aria-orientation={view === 'week' ? 'horizontal' : undefined}
        >
          {view === 'month'
            ? Array.from({ length: Math.ceil(cells.length / 7) }, (_, rowIndex) => (
                <div key={rowIndex} role="row" className="grid grid-cols-7 gap-1">
                  {cells.slice(rowIndex * 7, rowIndex * 7 + 7).map(renderCell)}
                </div>
              ))
            : cells.map(renderCell)}
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
