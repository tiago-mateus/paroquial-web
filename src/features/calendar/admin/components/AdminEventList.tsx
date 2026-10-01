import { CalendarPlus, Clock3, Copy, MapPin, MoreVertical, Pencil, Repeat2, SearchX, Trash2, X } from 'lucide-react';
import type { CalendarEvent } from '../../../../shared/api/events';
import { useEffect, useRef, useState } from 'react';
import { classNames } from '../../../../shared/lib/classNames';
import { formatEventTime, formatEventTimeRange } from '../../../events/event.utils';
import { eventTypeLabels } from '../calendarAdmin.constants';

type AdminEventListProps = {
  events: CalendarEvent[];
  isFiltered?: boolean;
  onEdit: (event: CalendarEvent) => void;
  onDuplicate: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
  onCreate: () => void;
  onClearFilters: () => void;
  onActionDialogChange?: (open: boolean) => void;
};

export function AdminEventList({ events, isFiltered = false, onEdit, onDuplicate, onDelete, onCreate, onClearFilters, onActionDialogChange }: AdminEventListProps) {
  const [actionEvent, setActionEvent] = useState<CalendarEvent | null>(null);
  const actionPanelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    onActionDialogChange?.(Boolean(actionEvent));
    return () => onActionDialogChange?.(false);
  }, [actionEvent, onActionDialogChange]);

  useEffect(() => {
    if (!actionEvent) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActionEvent(null);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        actionPanelRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? [],
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [actionEvent]);
  if (!events.length) {
    return (
      <div className="grid min-h-56 place-items-center border-b border-slate-100 bg-white px-6 py-10 text-center md:rounded-none md:border-0">
        <div>
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500">{isFiltered ? <SearchX size={21} /> : <CalendarPlus size={21} />}</span>
          <h3 className="m-0 mt-4 text-sm font-bold text-slate-950">{isFiltered ? 'Nenhum evento encontrado' : 'Nenhum evento neste dia'}</h3>
          <p className="mx-auto mb-0 mt-2 max-w-xs text-sm leading-6 text-slate-500">{isFiltered ? 'Ajuste a busca ou remova os filtros aplicados.' : 'Cadastre a primeira celebração ou atividade desta data.'}</p>
          <button type="button" onClick={isFiltered ? onClearFilters : onCreate} className="mt-5 h-11 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white">{isFiltered ? 'Limpar filtros' : 'Criar evento'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white px-3 shadow-[0_6px_22px_rgb(15_23_42/0.045)] sm:px-4 md:px-0" aria-label="Eventos da data selecionada">
      {events.map((event, index) => {
        const location = event.location?.trim() || 'Local a definir';
        return (
          <article key={`${event.occurrenceId}-${event.start}-${index}`} className="relative grid min-h-[7.25rem] grid-cols-[3.4rem_1rem_minmax(0,1fr)_2.75rem] gap-x-2 border-b border-slate-100 py-5 last:border-b-0 md:min-h-0 md:grid-cols-[4rem_minmax(0,1fr)_auto] md:items-center md:gap-x-3 md:px-5 md:py-4">
            <button
              type="button"
              onClick={() => setActionEvent(event)}
              aria-label={`Abrir ações de ${event.title}`}
              aria-haspopup="dialog"
              className="absolute inset-y-0 left-0 right-12 z-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500/40 md:hidden"
            />
            <div className="pt-0.5">
              <time dateTime={event.start} className="text-lg font-bold tracking-[-0.03em] text-slate-950 md:text-base">{formatEventTime(event.start)}</time>
            </div>

            <span className="relative flex h-full justify-center md:hidden" aria-hidden="true">
              <span className="absolute top-2 h-2.5 w-2.5 rounded-full bg-amber-600 ring-4 ring-amber-50 z-999" />
              {index < events.length - 1 ? <span className="absolute bottom-[-1rem] top-4 w-px bg-slate-200 z-0" /> : null}
            </span>

            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h3 className="m-0 line-clamp-2 text-base font-bold leading-tight text-slate-950 min-[390px]:text-[1.05rem] md:text-base">{event.title}</h3>
                <span className="hidden flex-none rounded-full bg-slate-100 px-2 py-1 text-[0.56rem] font-extrabold uppercase tracking-wide text-slate-500 md:inline-flex">{eventTypeLabels[event.type]}</span>
              </div>
              <p className="m-0 mt-1 flex min-w-0 items-center gap-1 text-[0.78rem] text-slate-500 md:text-xs"><MapPin size={15} className="flex-none text-slate-500" /><span className="truncate">{location}</span></p>
              <div className="mt-2 flex items-center gap-2 md:hidden">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.58rem] font-extrabold uppercase tracking-[0.08em] text-slate-600">{eventTypeLabels[event.type]}</span>
                {event.repeat !== 'none' ? <span className="inline-flex items-center gap-1 text-[0.65rem] font-semibold text-amber-800"><Repeat2 size={12} />{event.repeat === 'weekly' ? 'Semanal' : 'Mensal'}</span> : null}
              </div>
              <div className="mt-2 hidden flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500 md:flex">
                <span className="inline-flex items-center gap-2"><Clock3 size={15} />{formatEventTimeRange(event)} <span className="rounded-lg bg-slate-100 px-2 py-1 font-semibold text-slate-700">{formatDuration(event.start, event.end)}</span></span>
                {event.repeat !== 'none' ? <span className="inline-flex items-center gap-1 text-amber-700"><Repeat2 size={12} />{event.repeat === 'weekly' ? 'Semanal' : 'Mensal'}</span> : null}
              </div>
            </div>

            <button type="button" onClick={() => setActionEvent(event)} aria-label={`Ações de ${event.title}`} aria-haspopup="dialog" className="relative z-2 grid h-11 w-11 place-items-center self-start rounded-xl text-slate-500 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 active:bg-slate-100 md:hidden"><MoreVertical size={19} /></button>
            <div className="hidden md:col-start-3 md:row-start-1 md:mt-0 md:flex md:items-center md:gap-1">
              <ActionButton label="Editar" ariaLabel={`Editar ${event.title}`} icon={<Pencil size={15} />} onClick={() => onEdit(event)} primary />
              <ActionButton label="Duplicar" ariaLabel={`Duplicar ${event.title}`} icon={<Copy size={15} />} onClick={() => onDuplicate(event)} />
              <ActionButton label="Excluir" ariaLabel={`Excluir ${event.title}`} icon={<Trash2 size={15} />} onClick={() => onDelete(event)} danger />
            </div>
          </article>
        );
      })}
      {actionEvent ? (
        <div className="fixed inset-0 z-[70] flex items-end bg-slate-950/35 md:hidden" onMouseDown={(event) => event.target === event.currentTarget && setActionEvent(null)}>
          <section ref={actionPanelRef} role="dialog" aria-modal="true" aria-labelledby="event-actions-title" className="w-full rounded-t-2xl bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3 shadow-2xl">
            <div className="mx-auto h-1 w-10 rounded-full bg-slate-200" />
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3">
              <div className="min-w-0">
                <p className="m-0 text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-amber-700">Ações do evento</p>
                <h2 id="event-actions-title" className="m-0 mt-0.5 truncate text-base font-bold text-slate-950">{actionEvent.title}</h2>
              </div>
              <button ref={closeButtonRef} type="button" onClick={() => setActionEvent(null)} aria-label="Fechar ações" className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-slate-100 text-slate-600"><X size={18} /></button>
            </div>
            <div className="grid gap-1 pt-2">
              <button type="button" onClick={() => { const event = actionEvent; setActionEvent(null); onEdit(event); }} aria-label={`Editar ${actionEvent.title}`} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-bold text-slate-700 active:bg-slate-100"><Pencil size={17} /> Editar evento</button>
              <button type="button" onClick={() => { const event = actionEvent; setActionEvent(null); onDuplicate(event); }} aria-label={`Duplicar ${actionEvent.title}`} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-bold text-slate-700 active:bg-slate-100"><Copy size={17} /> Duplicar evento</button>
              <button type="button" onClick={() => { const event = actionEvent; setActionEvent(null); onDelete(event); }} aria-label={`Excluir ${actionEvent.title}`} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-bold text-red-700 active:bg-red-50"><Trash2 size={17} /> Excluir evento</button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function formatDuration(start: string, end?: string) {
  if (!end) return 'Sem duração';
  const minutes = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}min` : `${hours}h`;
}

function ActionButton({ label, ariaLabel, icon, onClick, primary = false, danger = false }: { label: string; ariaLabel: string; icon: React.ReactNode; onClick: () => void; primary?: boolean; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className={classNames('inline-flex h-11 w-11 min-w-0 items-center justify-center gap-1.5 rounded-xl px-0 text-[0.68rem] font-bold transition xl:w-auto xl:px-3', primary ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' : danger ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-amber-50 text-amber-900 hover:bg-amber-100')} title={label}>
      {icon}<span className="hidden truncate xl:inline">{label}</span>
    </button>
  );
}

export function AdminEventListSkeleton() {
  return (
    <div className="divide-y divide-slate-100 border-b border-slate-100 bg-white md:overflow-hidden md:border-0" aria-label="Carregando eventos">
      {[0, 1, 2].map((item) => <div key={item} className="grid animate-pulse grid-cols-[3.5rem_minmax(0,1fr)] gap-3 px-4 py-4 md:grid-cols-[4rem_minmax(0,1fr)_8rem] md:px-5"><span className="h-4 w-10 rounded bg-slate-100" /><span><span className="block h-4 w-2/5 rounded bg-slate-100" /><span className="mt-2 block h-3 w-1/3 rounded bg-slate-100" /></span><span className="hidden h-9 rounded bg-slate-100 md:block" /></div>)}
      <span className="sr-only" role="status">Carregando eventos...</span>
    </div>
  );
}
