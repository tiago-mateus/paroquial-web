import { ChevronRight, MapPin, Pencil } from 'lucide-react';
import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { CalendarEvent, EventType } from '../../../shared/api/events';
import { classNames } from '../../../shared/lib/classNames';
import {
  formatEventTime,
  formatEventTimeRange,
  hasEventFinished,
  isEventHappeningNow,
} from '../../events/event.utils';

const eventTypeLabels: Record<EventType, string> = {
  missa: 'Missa',
  novena: 'Novena',
  reuniao: 'Reunião',
  encontro: 'Encontro',
  adoracao: 'Adoração',
  movimento: 'Movimento',
  outro: 'Evento',
};

type TimelineEventosProps = {
  events: CalendarEvent[];
  now: Date;
  highlightedOccurrenceId?: string;
  variant?: 'public' | 'home' | 'admin';
  getHref?: (event: CalendarEvent) => string;
  onSelect?: (event: CalendarEvent) => void;
  selectActionLabel?: string;
  renderActions?: (event: CalendarEvent) => ReactNode;
};

export function TimelineEventos({
  events,
  now,
  highlightedOccurrenceId,
  variant = 'public',
  getHref,
  onSelect,
  selectActionLabel,
  renderActions,
}: TimelineEventosProps) {
  const isAdmin = variant === 'admin';
  const isHome = variant === 'home';
  const isEditorial = !isAdmin;

  return (
    <div
      className={classNames('relative overflow-hidden bg-white md:rounded-[1.2rem]')}
    >
      <span
        aria-hidden="true"
        className={classNames(
          'absolute bottom-[3.05rem] top-[1.69rem] z-0 w-px bg-slate-200',
          isHome ? 'left-[1.125rem]' : 'left-5 sm:left-10',
        )}
      />

      {events.map((event, index) => {
        const highlighted = event.occurrenceId === highlightedOccurrenceId;
        const happeningNow = isEventHappeningNow(event, now);
        const finished = hasEventFinished(event, now);
        const location =
          event.location?.trim() || (isAdmin ? 'Local a definir' : 'Local a confirmar');
        const statusLabel = highlighted ? (happeningNow ? 'Agora' : 'Próximo') : finished && isEditorial ? 'Encerrado' : null;
        const ariaLabel = [
          selectActionLabel,
          eventTypeLabels[event.type],
          event.title,
          formatEventTimeRange(event),
          location,
          statusLabel,
        ]
          .filter(Boolean)
          .join(', ');
        const className = classNames(
              'group relative m-0 grid w-full items-stretch gap-x-2 rounded-xl border-0 pl-0 pr-1 text-left transition-[transform,background-color,opacity] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500/35',
          isAdmin ? 'min-h-[4.25rem] py-2.5 sm:min-h-[4.75rem] sm:py-3.5' : 'min-h-[4.75rem] py-3.5',
          isEditorial ? 'active:scale-[0.995] active:bg-slate-50' : '',
          isHome
            ? 'grid-cols-[2.25rem_3.25rem_minmax(0,1fr)_1rem]'
            : isEditorial
              ? 'grid-cols-[2.5rem_3.5rem_minmax(0,1fr)_1rem] sm:grid-cols-[3rem_4rem_minmax(0,1fr)_1rem] sm:gap-x-3'
              : 'grid-cols-[2.5rem_3.25rem_minmax(0,1fr)_2.5rem] sm:grid-cols-[3rem_4rem_1px_minmax(0,1fr)_auto] sm:gap-x-3',
          isEditorial && finished && !highlighted ? 'opacity-75' : '',
          isAdmin
            ? 'text-slate-950 hover:bg-stone-50/80'
            : highlighted
              ? isHome
                ? 'bg-amber-50/70 text-slate-950 shadow-[0_2px_10px_rgb(180_83_9/0.06)] hover:bg-amber-50'
                : 'text-slate-950 hover:bg-amber-50/40'
              : 'text-slate-950 hover:bg-stone-50/80',
        );
        const content = (
          <>
            <span
              className={classNames(
                'relative z-10 flex justify-center',
                isEditorial ? 'items-center' : 'items-center sm:items-start sm:pt-4',
              )}
              aria-hidden="true"
            >
              <span
                className={classNames('block h-3.5 w-3.5 rounded-full',
                  highlighted
                    ? 'bg-amber-500 ring-2 ring-amber-500/40'
                    : finished && isEditorial
                      ? 'bg-slate-300 ring-2 ring-white'
                      : 'border-[1.5px] border-slate-300 bg-white')}
              />
            </span>
            <span className="flex items-center">
              <time
                className={classNames(
                  'whitespace-nowrap font-bold leading-6 tracking-[-0.01em]',
                  isEditorial ? 'text-sm' : 'text-sm sm:text-md',
                )}
                dateTime={event.start}
              >
                {formatEventTime(event.start)}
              </time>
            </span>
            {isAdmin ? <span aria-hidden="true" className="hidden h-full min-h-12 w-px bg-slate-200 sm:block" /> : null}
            <span className="min-w-0 self-center">
              {isEditorial && statusLabel ? (
                <small className={classNames(
                  'mb-1 inline-flex rounded-full px-1.5 py-0.5 text-[0.52rem] font-extrabold uppercase tracking-[0.08em]',
                  happeningNow
                    ? 'bg-amber-500 text-white'
                    : finished
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-amber-100 text-amber-800',
                )}>
                  {statusLabel}
                </small>
              ) : null}
              <span className="flex items-center gap-2">
                <strong
                  className={classNames(
                    'm-0 block min-w-0 font-bold leading-snug',
                    isEditorial ? 'line-clamp-2 text-base' : 'line-clamp-2 text-base sm:text-lg',
                  )}
                >
                  {event.title}
                </strong>
                {isAdmin ? (
                  <small className="hidden flex-none rounded-full bg-slate-100 px-2 py-1 text-[0.58rem] font-extrabold uppercase tracking-wide text-slate-500 sm:inline">
                    {eventTypeLabels[event.type]}
                  </small>
                ) : null}
              </span>
              <span
                className={classNames(
                  'mt-0 flex min-w-0 items-center gap-1.5 text-slate-500',
                  isAdmin ? 'text-xs' : 'text-sm leading-4',
                )}
              >
                <MapPin
                  aria-hidden="true"
                  className="flex-none text-slate-400"
                  size={isAdmin ? 12 : 14}
                />
                <span className={classNames('min-w-0', isEditorial ? 'line-clamp-2' : 'truncate')}>{location}</span>
                {event.repeat !== 'none' ? (
                  <span className="hidden flex-none text-amber-700 sm:inline">
                    {event.repeat === 'weekly' ? 'Semanal' : 'Mensal'}
                  </span>
                ) : null}
              </span>
            </span>
            {renderActions ? (
              renderActions(event)
            ) : selectActionLabel ? (
              <span
                className="ml-1 flex items-center self-center text-slate-400 transition group-hover:text-amber-700"
                aria-hidden="true"
              >
                <span className="hidden text-xs font-bold sm:inline">{selectActionLabel}</span>
                <span className="ml-1.5 grid h-9 w-9 place-items-center rounded-lg bg-slate-50 transition group-hover:bg-amber-50">
                  <Pencil size={15} />
                </span>
              </span>
            ) : isEditorial ? (
              <span className="flex items-center justify-end text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-600" aria-hidden="true">
                <ChevronRight size={16} />
              </span>
            ) : null}
          </>
        );

        return (
          <article
            key={`${event.occurrenceId}-${event.start}-${index}`}
            className={classNames(
              'relative z-10',
              isHome && index > 0 ? 'border-t border-slate-100/80' : '',
              index > 0 && isAdmin ? 'border-t border-slate-100' : '',
            )}
          >
            {getHref ? (
              <Link to={getHref(event)} aria-label={ariaLabel} className={className}>
                {content}
              </Link>
            ) : isAdmin ? (
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelect?.(event)}
                onKeyDown={(keyboardEvent) => {
                  if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                    keyboardEvent.preventDefault();
                    onSelect?.(event);
                  }
                }}
                aria-label={ariaLabel}
                className={className}
              >
                {content}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onSelect?.(event)}
                aria-label={ariaLabel}
                className={className}
              >
                {content}
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}
