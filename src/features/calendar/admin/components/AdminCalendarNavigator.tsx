import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { calendarViewOptions, type CalendarViewMode } from '../calendarAdmin.constants';
import { formatPeriodLabel } from '../eventPresentation';

type AdminCalendarNavigatorProps = {
  view: CalendarViewMode;
  onViewChange: (view: CalendarViewMode) => void;
  selectedDate: Date;
  onToday: () => void;
  onChangePeriod: (amount: number) => void;
  onOpenMonth: () => void;
};

const iconButton = 'inline-flex size-10 items-center justify-center rounded-xl text-ink hover:bg-selection';

/** Barra única de navegação temporal: período e controles à esquerda, modo de exibição à direita. */
export function AdminCalendarNavigator({ view, onViewChange, selectedDate, onToday, onChangePeriod, onOpenMonth }: AdminCalendarNavigatorProps) {
  const unit = view === 'week' ? 'semana' : 'mês';
  const label = formatPeriodLabel(view, selectedDate);
  return <section aria-label="Navegação da agenda" className="agenda-date-navigation min-w-0">
    <div className="agenda-period-row flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <h2 id="admin-agenda-period" className="m-0 min-w-0 text-lg font-semibold tracking-tight text-ink md:text-xl">
          {/* No modo mensal a própria grade serve de seletor de datas; nos demais, o rótulo abre o mês. */}
          {view === 'month'
            ? <span aria-live="polite" className="inline-flex min-h-10 items-center">{label}</span>
            : <button type="button" onClick={onOpenMonth} aria-label="Abrir calendário mensal" aria-haspopup="dialog" className="flex min-h-10 items-center gap-1.5 rounded-xl pr-2 text-left hover:bg-selection/40"><span aria-live="polite">{label}</span><ChevronDown size={16} strokeWidth={1.5} className="shrink-0 text-muted" aria-hidden="true" /></button>}
        </h2>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onChangePeriod(-1)} aria-label={unit === 'semana' ? 'Semana anterior' : 'Mês anterior'} className={iconButton}><ChevronLeft size={20} strokeWidth={1.5} aria-hidden="true" /></button>
          <button type="button" onClick={() => onChangePeriod(1)} aria-label={unit === 'semana' ? 'Próxima semana' : 'Próximo mês'} className={iconButton}><ChevronRight size={20} strokeWidth={1.5} aria-hidden="true" /></button>
          <button type="button" onClick={onToday} className="ml-1 inline-flex min-h-10 items-center rounded-xl border border-line px-3.5 text-sm font-semibold text-primary hover:bg-selection">Hoje</button>
        </div>
      </div>
      <div role="group" aria-label="Visualização da agenda" className="agenda-view-options flex items-center gap-0.5 rounded-xl border border-line p-0.5 max-sm:w-full [&>button]:max-sm:flex-1">
        {calendarViewOptions.map(([value, text]) => <button key={value} type="button" onClick={() => onViewChange(value)} aria-pressed={view === value} className={`min-h-9 rounded-[10px] px-4 text-sm transition-colors motion-reduce:transition-none ${view === value ? 'bg-selection font-semibold text-primary' : 'text-muted hover:bg-selection/50 hover:text-primary'}`}>{text}</button>)}
      </div>
    </div>
  </section>;
}
