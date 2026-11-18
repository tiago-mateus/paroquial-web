import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { getTenantEvents } from '../../../shared/api/events';
import { IconButton } from '../../../shared/components/IconButton';
import { addDays, getEventCountsByDate, getMonthGrid, getWeekDays, isSameDay, toDateKey } from '../calendar.utils';

type View = 'week' | 'month';
type Props = {
  tenantSlug: string;
  selectedDate: Date;
  displayedDate: Date;
  onSelectDate: (date: Date) => void;
  onNavigateDate: (date: Date) => void;
};

const fullDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' });
const shortDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' });
const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const viewStorageKey = 'paroquial-public-calendar-view';

export function PublicDatePicker({ tenantSlug, selectedDate, displayedDate, onSelectDate, onNavigateDate }: Props) {
  const [view, setView] = useState<View>(() => {
    try {
      const saved = sessionStorage.getItem(viewStorageKey);
      if (saved === 'week' || saved === 'month') return saved;
    } catch { /* A preferência é opcional quando o armazenamento está indisponível. */ }
    return window.matchMedia('(min-width: 768px)').matches ? 'month' : 'week';
  });
  const [focusedKey, setFocusedKey] = useState(toDateKey(selectedDate));
  const gridRef = useRef<HTMLDivElement>(null);
  const focusAfterNavigation = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const today = new Date();
  const cells = view === 'month'
    ? getMonthGrid(displayedDate)
    : getWeekDays(displayedDate, true).map((date) => ({ date, adjacent: false }));
  const rangeStart = toDateKey(cells[0].date);
  const rangeEnd = toDateKey(cells[cells.length - 1].date);
  const eventsQuery = useQuery({
    queryKey: ['events', tenantSlug, rangeStart, rangeEnd],
    queryFn: () => getTenantEvents(tenantSlug, rangeStart, rangeEnd),
    enabled: Boolean(tenantSlug),
  });
  const counts = getEventCountsByDate(eventsQuery.data ?? []);
  const focusedIsVisible = cells.some(({ date }) => toDateKey(date) === focusedKey);
  const selectedIsVisible = cells.some(({ date }) => isSameDay(date, selectedDate));
  const tabStop = focusedIsVisible ? focusedKey : selectedIsVisible ? toDateKey(selectedDate) : rangeStart;
  const first = cells[0].date;
  const last = cells[cells.length - 1].date;
  const crossesMonth = view === 'week' && first.getMonth() !== last.getMonth();
  const month = displayedDate.toLocaleDateString('pt-BR', { month: 'long' });
  const period = crossesMonth
    ? `${shortDate.format(first).replace('.', '')} – ${shortDate.format(last).replace('.', '')}`
    : month.charAt(0).toUpperCase() + month.slice(1);
  const year = first.getFullYear() !== last.getFullYear()
    ? `${first.getFullYear()} / ${last.getFullYear()}`
    : displayedDate.getFullYear();

  useEffect(() => {
    if (!focusAfterNavigation.current) return;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focusedKey}"]`)?.focus();
    focusAfterNavigation.current = false;
  }, [focusedKey, rangeStart, rangeEnd]);

  function changeView(next: View) {
    setView(next);
    onNavigateDate(selectedDate);
    setFocusedKey(toDateKey(selectedDate));
    try { sessionStorage.setItem(viewStorageKey, next); } catch { /* O calendário funciona sem persistência. */ }
  }

  function changePeriod(amount: number) {
    onNavigateDate(view === 'week'
      ? addDays(displayedDate, amount * 7)
      : new Date(displayedDate.getFullYear(), displayedDate.getMonth() + amount, 1));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, date: Date) {
    let next: Date | null = null;
    if (event.key === 'ArrowLeft') next = addDays(date, -1);
    if (event.key === 'ArrowRight') next = addDays(date, 1);
    if (event.key === 'ArrowUp') next = addDays(date, -7);
    if (event.key === 'ArrowDown') next = addDays(date, 7);
    if (event.key === 'Home') next = getWeekDays(date, true)[0];
    if (event.key === 'End') next = getWeekDays(date, true)[6];
    if (!next) return;
    event.preventDefault();
    focusAfterNavigation.current = true;
    setFocusedKey(toDateKey(next));
    if (toDateKey(next) < rangeStart || toDateKey(next) > rangeEnd) onNavigateDate(next);
  }

  return (
    <div className="min-w-0 rounded-2xl border border-line bg-surface p-4 max-[374px]:p-2 sm:p-5">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div aria-live="polite" aria-atomic="true" className="min-w-0 pl-1">
          <p className="m-0 font-display text-xl font-medium leading-6 text-ink">{period}<span className="ml-1 font-normal text-muted">{year}</span></p>
        </div>
        <div className="flex shrink-0">
          <IconButton onClick={() => changePeriod(-1)} label={view === 'week' ? 'Semana anterior' : 'Mês anterior'} icon={ChevronLeft} tone="primary" />
          <IconButton onClick={() => changePeriod(1)} label={view === 'week' ? 'Próxima semana' : 'Próximo mês'} icon={ChevronRight} tone="primary" />
        </div>
      </header>

      <div className="mb-4 flex items-center justify-between gap-2 border-b border-line pb-3">
        <div role="group" aria-label="Visualização do calendário" className="flex gap-1 rounded-xl bg-canvas p-1">
        {(['week', 'month'] as const).map((option) => <button key={option} type="button" aria-pressed={view === option} onClick={() => changeView(option)} className={`min-h-11 rounded-lg px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-focus motion-reduce:transition-none ${view === option ? 'bg-primary font-semibold text-white' : 'font-medium text-muted hover:text-primary'}`}>{option === 'week' ? 'Semana' : 'Mês'}</button>)}
        </div>
        <button type="button" onClick={() => onSelectDate(today)} className="min-h-11 shrink-0 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-selection focus-visible:outline-2 focus-visible:outline-focus">Hoje</button>
      </div>

      {view === 'month' ? <div aria-hidden="true" className="mb-2 grid grid-cols-7">{weekdays.map((label) => <span key={label} className="text-center text-[13px] font-medium text-muted">{label}</span>)}</div> : null}
      <div ref={gridRef} role="grid" aria-label={view === 'month' ? 'Calendário mensal' : 'Calendário semanal'} className="touch-pan-y"
        onPointerDown={(event) => { if (event.pointerType === 'touch') touchStart.current = { x: event.clientX, y: event.clientY }; }}
        onPointerCancel={() => { touchStart.current = null; }}
        onPointerUp={(event) => {
          const start = touchStart.current;
          touchStart.current = null;
          if (!start) return;
          const deltaX = event.clientX - start.x;
          if (Math.abs(deltaX) < 42 || Math.abs(deltaX) <= Math.abs(event.clientY - start.y)) return;
          suppressClick.current = true;
          changePeriod(deltaX > 0 ? -1 : 1);
          window.setTimeout(() => { suppressClick.current = false; }, 0);
        }}>
        {Array.from({ length: cells.length / 7 }, (_, row) => (
          <div key={row} role="row" className="grid grid-cols-7 py-0.5">
            {cells.slice(row * 7, row * 7 + 7).map(({ date, adjacent }) => {
              const key = toDateKey(date);
              const selected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, today);
              const count = counts.get(key) ?? 0;
              const countLabel = eventsQuery.isError ? 'eventos indisponíveis' : eventsQuery.isPending ? 'consultando eventos' : count ? `${count} ${count === 1 ? 'evento' : 'eventos'}` : 'sem eventos';
              return <div key={key} role="gridcell" aria-selected={selected}>
                <button type="button" data-date={key} tabIndex={key === tabStop ? 0 : -1} aria-current={isToday ? 'date' : undefined} aria-label={`${fullDate.format(date)}${isToday ? ', hoje' : ''}${selected ? ', selecionado' : ''}${adjacent ? ', mês adjacente' : ''}, ${countLabel}`} onFocus={() => setFocusedKey(key)} onKeyDown={(event) => handleKeyDown(event, date)} onClick={() => { if (!suppressClick.current) onSelectDate(date); }} className={`flex min-h-14 w-full min-w-0 flex-col items-center justify-center gap-1 rounded-xl py-2 transition-colors focus-visible:outline-2 focus-visible:outline-focus motion-reduce:transition-none ${view === 'week' ? 'min-h-18' : ''} ${selected ? 'bg-accent text-accent-ink' : adjacent ? 'text-muted hover:bg-selection' : 'text-ink hover:bg-selection'}`}>
                  {view === 'week' ? <span className={`text-[13px] font-medium ${selected ? 'text-accent-ink' : 'text-muted'}`}>{weekdays[(date.getDay() + 6) % 7]}</span> : null}
                  <span className={`text-base leading-6 tabular-nums ${selected ? 'font-extrabold' : 'font-semibold'} ${isToday ? 'underline decoration-primary decoration-2 underline-offset-4' : ''}`}>{date.getDate()}</span>
                  <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${count ? 'bg-primary' : 'bg-transparent'}`} />
                </button>
              </div>;
            })}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line px-1 pt-4 text-[13px] text-muted">
        <span className="flex items-center gap-1.5"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary" />Com eventos</span>
      </div>
      {eventsQuery.isPending ? <p role="status" className="mb-0 mt-3 px-1 text-[13px] text-muted">Consultando eventos deste período…</p> : null}
      {eventsQuery.isError ? <div className="mt-3 px-1"><p role="status" className="m-0 text-[13px] text-muted">Não foi possível consultar os eventos deste período.</p><button type="button" onClick={() => void eventsQuery.refetch()} className="min-h-11 text-sm font-bold text-primary hover:underline">Tentar novamente</button></div> : null}
    </div>
  );
}
