import type { KeyboardEvent } from 'react';
import { classNames } from '../../../shared/lib/classNames';

type CalendarDateCellProps = {
  date: Date; selected: boolean; today: boolean; eventCount: number;
  compact?: boolean; adjacent?: boolean; weekdayLabel?: string;
  selectionTone?: 'slate' | 'amber' | 'blue';
  role?: 'option' | 'gridcell'; tabIndex?: number; ariaLabel: string;
  onClick: () => void; onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
};

export function CalendarDateCell({date,selected,today,eventCount,compact=false,adjacent=false,weekdayLabel,role,tabIndex,ariaLabel,onClick,onKeyDown}:CalendarDateCellProps) {
  return <button type="button" role={role} aria-selected={selected} aria-current={today?'date':undefined} aria-label={ariaLabel} tabIndex={tabIndex} onClick={onClick} onKeyDown={onKeyDown} className={classNames(
    'group relative flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 rounded-xl p-0 transition-colors focus-visible:z-10 motion-reduce:transition-none',
    compact ? 'min-h-12 md:min-h-16' : '',
    weekdayLabel ? 'min-h-20 py-2' : '',
    selected && weekdayLabel ? 'bg-accent text-accent-ink' : 'bg-transparent text-ink hover:bg-selection',
  )}>
    {weekdayLabel ? <span className={classNames('text-[13px] font-medium capitalize',selected?'text-accent-ink':'text-muted')}>{weekdayLabel}</span>:null}
    <span className={classNames(
      'inline-flex size-8 shrink-0 items-center justify-center rounded-full text-base font-semibold tabular-nums',
      selected ? 'bg-accent font-extrabold text-accent-ink ring-1 ring-inset ring-accent-ink/70' : adjacent?'text-muted':'text-ink',
      today ? 'outline outline-primary outline-offset-2' : '',
    )}>{date.getDate()}</span>
    {weekdayLabel ? <span aria-hidden="true" className="min-h-4 text-[13px] font-semibold">{eventCount>0&&!adjacent?eventCount:null}</span> : <span aria-hidden="true" className={classNames('size-1.5 rounded-full',eventCount>0&&!adjacent?'bg-primary':'bg-transparent')} />}
  </button>;
}
