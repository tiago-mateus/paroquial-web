import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import type { CalendarEvent } from '../../../../shared/api/events';
import { Agenda } from '../../components/Agenda';
import { formatMonth } from '../../calendar.utils';

type AdminCalendarNavigatorProps = {
  events: CalendarEvent[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onChangePeriod: (amount: number) => void;
  onOpenMonth: () => void;
};

export function AdminCalendarNavigator({
  events,
  selectedDate,
  onSelectDate,
  onChangePeriod,
  onOpenMonth,
}: AdminCalendarNavigatorProps) {
  return (
    <section
      className="border-b border-slate-200 bg-white lg:hidden"
      aria-label="Navegação da agenda"
    >
      {/* Navegação do período */}
      <div className="flex items-center px-4 pb-2 pt-3">
        <div className="flex min-w-0 flex-1 items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => onChangePeriod(-1)}
            aria-label="Semana anterior"
            className="
              grid size-9 flex-none place-items-center
              rounded-lg text-slate-500
              transition-colors
              hover:bg-slate-50 hover:text-slate-900
              active:bg-slate-100
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-amber-500/40
            "
          >
            <ChevronLeft size={19} strokeWidth={2} />
          </button>

          <div
            className="min-w-[9rem] px-2 text-center"
            aria-live="polite"
          >
            <strong className="block text-[1.3rem] font-bold capitalize leading-none tracking-tight text-slate-950">
              {formatMonth(selectedDate)}
            </strong>
          </div>

          <button
            type="button"
            onClick={() => onChangePeriod(1)}
            aria-label="Próxima semana"
            className="
              grid size-9 flex-none place-items-center
              rounded-lg text-slate-500
              transition-colors
              hover:bg-slate-50 hover:text-slate-900
              active:bg-slate-100
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-amber-500/40
            "
          >
            <ChevronRight size={19} strokeWidth={2} />
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenMonth}
          aria-label="Abrir calendário mensal"
          className="
            ml-2 flex h-9 flex-none items-center gap-1.5
            rounded-lg px-2.5
            text-xs font-semibold text-slate-600
            transition-colors
            hover:bg-slate-50 hover:text-slate-900
            active:bg-slate-100
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-amber-500/40 border border-slate-500
          "
        >
          <CalendarDays size={16} />
          <span>Mês</span>
        </button>
      </div>

      {/* Semana */}
      <Agenda
        events={events}
        selectedDate={selectedDate}
        view="week"
        onSelectDate={onSelectDate}
        hideToolbar
        integratedWeekLabels
        selectionTone="amber"
        plain
      />
    </section>
  );
}
