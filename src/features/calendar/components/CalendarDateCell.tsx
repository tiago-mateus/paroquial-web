import { type KeyboardEvent } from "react";
import { classNames } from "../../../shared/lib/classNames";

type CalendarDateCellProps = {
  date: Date;
  selected: boolean;
  today: boolean;
  eventCount: number;
  compact?: boolean;
  weekdayLabel?: string;
  role?: "option" | "gridcell";
  tabIndex?: number;
  ariaLabel: string;
  onClick: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
};

export function CalendarDateCell({ date, selected, today, eventCount, compact = false, weekdayLabel, role, tabIndex, ariaLabel, onClick, onKeyDown }: CalendarDateCellProps) {
  const visibleEventDots = Math.min(eventCount, 3);

  return (
    <button type="button" role={role} aria-selected={selected} aria-current={today ? "date" : undefined} aria-label={ariaLabel} tabIndex={tabIndex} onClick={onClick} onKeyDown={onKeyDown} className={classNames(
      "group relative grid min-w-0 place-items-center rounded-xl bg-white p-0 text-xs font-semibold transition duration-200 hover:bg-slate-50 active:scale-[0.97] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 md:text-sm",
      compact ? "min-h-10 md:min-h-[4.25rem]" : "min-h-12 md:min-h-[4.25rem]",
      weekdayLabel ? "gap-0.5 rounded-2xl py-1" : "",
      selected ? "text-white" : "text-slate-700",
    )}>
      {weekdayLabel ? <span className={classNames("text-[0.58rem] font-extrabold uppercase tracking-wide", selected ? "text-slate-500" : "text-slate-400")}>{weekdayLabel}</span> : null}
      <span className={classNames("grid h-7 w-7 place-items-center rounded-full md:h-8 md:w-8", selected ? "bg-slate-950 shadow-sm" : today ? "ring-1 ring-inset ring-amber-400 text-amber-800" : "")}>{date.getDate()}</span>
      {visibleEventDots > 0 ? (
        <span aria-hidden="true" className={classNames("absolute flex items-center gap-0.5 md:bottom-1.5", compact ? "bottom-0.5" : "bottom-1")}>
          {Array.from({ length: visibleEventDots }, (_, index) => (
            <span key={index} className={classNames("h-1 w-1 rounded-full", selected ? "bg-amber-300" : "bg-amber-500")} />
          ))}
        </span>
      ) : null}
    </button>
  );
}
