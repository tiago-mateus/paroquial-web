import { type KeyboardEvent } from 'react';
import { classNames } from '../../../shared/lib/classNames';

type CalendarDateCellProps = {
  date: Date;
  selected: boolean;
  today: boolean;
  eventCount: number;
  compact?: boolean;
  /** Dia pertence ao mês anterior ou próximo */
  adjacent?: boolean;
  weekdayLabel?: string;
  selectionTone?: 'slate' | 'amber';
  role?: 'option' | 'gridcell';
  tabIndex?: number;
  ariaLabel: string;
  onClick: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
};

export function CalendarDateCell({
  date,
  selected,
  today,
  eventCount,
  compact = false,
  adjacent = false,
  weekdayLabel,
  selectionTone = 'slate',
  role,
  tabIndex,
  ariaLabel,
  onClick,
  onKeyDown,
}: CalendarDateCellProps) {
  return (
    <button
      type="button"
      role={role}
      aria-selected={selected}
      aria-current={today ? 'date' : undefined}
      aria-label={ariaLabel}
      tabIndex={tabIndex}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={classNames(
        'group relative flex min-w-0 flex-col items-center justify-center rounded-xl p-0 transition duration-200 active:scale-[0.97] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 motion-reduce:transition-none',
        // Mês: altura compacta com número e indicador alinhados
        compact ? 'min-h-12 gap-0.5 md:min-h-[4.5rem] md:gap-1' : 'min-h-12 md:min-h-[4.25rem]',
        weekdayLabel ? 'min-h-[4.5rem] gap-1 py-1.5' : '',
        // Evita classes de fundo concorrentes: o estado selecionado precisa permanecer legível.
        weekdayLabel
          ? selected
            ? selectionTone === 'amber'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-slate-950 text-white'
            : today
              ? 'bg-amber-50/70 hover:bg-amber-50'
              : 'bg-white hover:bg-slate-50'
          : 'bg-white hover:bg-slate-50',
      )}
    >
      {weekdayLabel ? (
        <span
          className={classNames(
            'text-[0.62rem] font-semibold uppercase tracking-[0.03em]',
            selected ? 'text-white' : today ? 'text-amber-900' : 'text-slate-500',
          )}
        >
          {weekdayLabel}
        </span>
      ) : null}

      {/* Número do dia — mantém 20 px; o ring usa offset para não encostar no texto. */}
      <span
        className={classNames(
          'inline-flex h-5 w-5 shrink-0 select-none items-center justify-center rounded-full text-[0.95rem] font-semibold leading-none tabular-nums transition',
          compact ? 'md:h-9 md:w-9 md:text-base' : '',
          selected
            ? weekdayLabel
              ? 'font-bold text-white'
              : selectionTone === 'amber'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-950 text-white shadow-sm'
            : today
              ? 'bg-amber-50 text-amber-900 ring-2 ring-amber-400 ring-offset-2 ring-offset-white'
              : adjacent
                ? 'text-slate-300'
                : 'text-slate-700',
        )}
      >
        {date.getDate()}
      </span>

      {weekdayLabel && eventCount > 0 && !adjacent ? (
        <span
          aria-hidden="true"
          className={classNames(
            'inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.58rem] font-bold leading-none tabular-nums',
            selected ? 'bg-white text-amber-700' : 'bg-orange-50 text-orange-700',
          )}
        >
          {eventCount > 9 ? '9+' : eventCount}
        </span>
      ) : eventCount > 0 && !adjacent ? (
        <span
          aria-hidden="true"
          className={classNames(
            'h-1.5 w-1.5 rounded-full',
            selected ? 'bg-orange-300' : 'bg-orange-500',
          )}
        />
      ) : (
        <span aria-hidden="true" className={weekdayLabel ? 'h-4' : 'h-1.5 w-1.5'} />
      )}
    </button>
  );
}
