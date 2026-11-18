import { CalendarPlus, Copy, MapPin, Pencil, Repeat, SearchX, Trash2 } from 'lucide-react';
import { useId } from 'react';
import type { CalendarEvent } from '../../../../shared/api/events';
import { AdminActionMenu } from '../../../admin/AdminActionMenu';
import { formatEventTime } from '../../../events/event.utils';
import { eventTypeDotClass, eventTypeLabels } from '../calendarAdmin.constants';
import { getEventTiming, getEventTitle } from '../eventPresentation';

export type AdminEventListActions = {
  onEdit: (event: CalendarEvent) => void;
  onDuplicate: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
};

type AdminEventListProps = AdminEventListActions & {
  events: CalendarEvent[];
  isFiltered?: boolean;
  emptyScope?: 'day' | 'week' | 'month';
  onCreate: () => void;
  onClearFilters: () => void;
};

const emptyTitles = { day: 'Nenhum evento neste dia', week: 'Nenhum evento nesta semana', month: 'Nenhum evento neste mês' } as const;

export function AdminEventList({ events, isFiltered = false, emptyScope = 'day', onEdit, onDuplicate, onDelete, onClearFilters }: AdminEventListProps) {
  if (!events.length) {
    return <div className="agenda-empty-state px-4 py-12 text-center [&_p]:text-base">
      <div>
        <span className="mx-auto grid h-11 w-11 place-items-center text-muted">{isFiltered ? <SearchX size={24} aria-hidden="true" /> : <CalendarPlus size={24} aria-hidden="true" />}</span>
        <h3 className="m-0 mt-4 text-base font-semibold text-ink">{isFiltered ? 'Nenhum evento encontrado' : emptyTitles[emptyScope]}</h3>
        <p className="mx-auto mb-0 mt-2 max-w-sm text-sm leading-6 text-muted">{isFiltered ? 'Ajuste a busca ou remova os filtros aplicados.' : 'Use Novo evento para incluir uma celebração ou atividade da comunidade.'}</p>
        {isFiltered ? <button type="button" onClick={onClearFilters} className="agenda-empty-action mt-4 min-h-11 rounded-xl border border-line px-4 text-base text-primary hover:bg-selection">Limpar filtros</button> : null}
      </div>
    </div>;
  }
  return <ol className="agenda-event-list m-0 grid list-none divide-y divide-line/60 p-0" aria-label="Eventos da data selecionada">
    {events.map((event, index) => <li key={`${event.occurrenceId}-${event.start}-${index}`}><EventRow event={event} onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete} /></li>)}
  </ol>;
}

function EventRow({ event, onEdit, onDuplicate, onDelete }: AdminEventListActions & { event: CalendarEvent }) {
  const titleId = useId();
  const title = getEventTitle(event);
  const { end, endsAnotherDay, allDay, ongoing, past } = getEventTiming(event);
  const location = event.location?.trim();

  return <article aria-labelledby={titleId} data-past={past || undefined} className="agenda-event-row group relative -mx-2 grid min-w-0 grid-cols-[4rem_minmax(0,1fr)_2.75rem] items-start gap-x-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-selection/40 has-[:focus-visible]:bg-selection/40 motion-reduce:transition-none md:grid-cols-[0.625rem_5rem_minmax(0,1fr)_2.75rem] md:gap-x-4">
    <i className={`mt-2.5 hidden size-2.5 rounded-full md:block ${eventTypeDotClass[event.type]}`} aria-hidden="true" />
    <div className="agenda-event-time flex min-w-0 flex-col tabular-nums">
      {allDay
        ? <time dateTime={event.start} className={`text-[15px] font-medium leading-6 ${past ? 'text-muted' : 'text-ink'}`}>Dia inteiro</time>
        : <>
          <time dateTime={event.start} className={`text-[15px] font-medium leading-6 tabular-nums ${past ? 'text-muted' : 'text-ink'}`}><span className="sr-only">Início: </span>{formatEventTime(event.start)}</time>
          {end && event.end ? <time dateTime={event.end} className="flex flex-col text-[13px] leading-5 text-muted">
            <span className="whitespace-nowrap">até {formatEventTime(event.end)}</span>
            {endsAnotherDay ? <span className="text-xs" aria-label={end.toLocaleDateString('pt-BR', { dateStyle: 'full' })}>{end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span> : null}
          </time> : null}
        </>}
    </div>
    <div className="agenda-event-information min-w-0 [&_h3]:m-0 [&_h3]:text-base [&_h3]:leading-6 [&_h3]:font-semibold">
      <h3 id={titleId} className="flex flex-wrap items-center gap-x-2"><button type="button" onClick={() => onEdit(event)} aria-label={`Editar ${title}`} title={title} className={`agenda-event-title line-clamp-2 max-w-full text-left [overflow-wrap:anywhere] after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-[-2px] focus-visible:after:outline-focus focus-visible:after:[outline-style:solid] group-hover:text-primary ${past ? 'text-muted' : 'text-ink'} ${event.title?.trim() ? '' : 'italic'}`}>{title}</button>{ongoing ? <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold leading-4 text-accent-ink">Agora</span> : null}</h3>
      {past ? <p className="sr-only">Evento já realizado.</p> : null}
      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] leading-5">
        <span className="agenda-event-category inline-flex items-center gap-1.5 text-muted"><i className={`block size-2 rounded-full md:hidden ${eventTypeDotClass[event.type]}`} aria-hidden="true" />{eventTypeLabels[event.type]}</span>
        {event.repeat !== 'none' ? <span className="inline-flex items-center gap-1 text-muted"><Repeat size={13} aria-hidden="true" />{event.repeat === 'weekly' ? 'Semanal' : 'Mensal'}</span> : null}
        {location
          ? <span title={location} className="inline-flex min-w-0 items-start gap-1 text-muted [overflow-wrap:anywhere]"><MapPin size={13} className="mt-[3px] shrink-0" aria-hidden="true" /><span className="line-clamp-2">{location}</span></span>
          : <span className="inline-flex items-center gap-1 font-medium text-warning"><MapPin size={13} aria-hidden="true" />Local a definir</span>}
      </div>
    </div>
    <div className="agenda-event-actions relative z-10 -my-1.5 flex items-start [&>button]:min-h-11 [&>button]:min-w-11 [&>button]:rounded-lg [&>button]:text-muted [&>button:hover]:bg-selection [&>button:hover]:text-ink">
        <AdminActionMenu quiet label={title} actions={[
          { label: `Editar ${title}`, icon: Pencil, onClick: () => onEdit(event) },
          { label: `Duplicar ${title}`, icon: Copy, onClick: () => onDuplicate(event) },
          { label: `Excluir ${title}`, icon: Trash2, danger: true, onClick: () => onDelete(event) },
        ]} />
    </div>
  </article>;
}


export function AdminEventListSkeleton() {
  return <div className="agenda-loading pt-6" aria-label="Carregando eventos">
    <div aria-hidden="true"><div className="agenda-loading-heading mb-6 h-6 w-1/2 bg-selection" />{[0, 1, 2].map(item => <div key={item} className="agenda-loading-row grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4 border-b border-line py-6">
      <span className="agenda-loading-time block h-4 bg-selection" />
      <span><span className="agenda-loading-title block h-4 w-[65%] bg-selection" /><span className="agenda-loading-place mt-3 block h-4 w-[85%] bg-selection" /></span>
    </div>)}</div>
    <span className="sr-only" role="status">Carregando eventos...</span>
  </div>;
}
