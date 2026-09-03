import type { CalendarEvent } from "../../../shared/api/events";
import { Check } from "lucide-react";
import { formatSelectedDate } from "../calendar.utils";

type CalendarMobileHeaderProps = {
  selectedDate: Date;
  selectedEvents: CalendarEvent[];
  isTodaySelected: boolean;
  onToday: () => void;
  eyebrow?: string;
  compact?: boolean;
};

export function CalendarMobileHeader({ selectedDate, selectedEvents, isTodaySelected, onToday, eyebrow = "Agenda da comunidade", compact = false }: CalendarMobileHeaderProps) {
  return (
    <div className="grid min-w-0 gap-2 md:hidden">
      <div className="min-w-0">
        <p className="m-0 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-amber-700">{eyebrow}</p>
        <div className={`mt-1.5 flex min-w-0 items-center justify-between ${compact ? "gap-2" : "gap-3"}`}>
          <div className="min-w-0">
            <h1 className={`m-0 font-bold leading-tight tracking-[-0.025em] ${compact ? "text-[1.05rem] min-[410px]:whitespace-nowrap min-[410px]:text-[1.1rem]" : "max-w-[17rem] text-[1.1rem] min-[380px]:text-[1.2rem]"}`}>{formatSelectedDate(selectedDate)}</h1>
            <p className="m-0 mt-1 text-xs font-medium text-slate-500">{formatEventCount(selectedEvents)}</p>
          </div>
          <button type="button" onClick={onToday} aria-pressed={isTodaySelected} className={`inline-flex flex-none items-center gap-1.5 rounded-xl border text-xs font-bold transition ${compact ? "h-10 px-3" : "h-11 px-3.5"} ${isTodaySelected ? "border-slate-200 bg-slate-50 text-slate-500" : "border-amber-200 bg-white text-amber-800 hover:bg-amber-50"}`}>
            Hoje
            {isTodaySelected ? <Check size={13} aria-hidden="true" /> : null}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatEventCount(events: CalendarEvent[]) {
  if (!events.length) return "Nenhum evento programado";
  return `${events.length} ${events.length === 1 ? "evento programado" : "eventos programados"}`;
}
