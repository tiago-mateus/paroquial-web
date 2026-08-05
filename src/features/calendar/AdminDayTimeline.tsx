import { CalendarPlus, Copy, MoreHorizontal, Pencil, SearchX } from 'lucide-react';
import { useState } from 'react';
import type { CalendarEvent } from '../../shared/api/events';
import { TimelineEventos } from './components/TimelineEventos';
import { hasEventFinished } from '../events/event.utils';
import { useNow } from "../events/useNow";

export function AdminDayTimeline({
  events,
  onSelect,
  onDuplicate,
  onCreate,
  isFiltered = false,
  onClearFilters,
}: {
  events: CalendarEvent[];
  onSelect: (event: CalendarEvent) => void;
  onDuplicate: (event: CalendarEvent) => void;
  onCreate: () => void;
  isFiltered?: boolean;
  onClearFilters?: () => void;
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const now = useNow();
  if (!events.length) {
    return (
      <div className="grid min-h-56 place-items-center rounded-[1.5rem] border border-slate-200/80 bg-white px-6 py-10 text-center shadow-[0_8px_28px_rgb(15_23_42/0.035)]">
        <div>
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-50 text-slate-400">
            {isFiltered ? <SearchX size={21} /> : <CalendarPlus size={21} />}
          </span>
          <h3 className="mb-0 mt-4 text-sm font-bold text-slate-900">
            {isFiltered ? 'Nenhum evento encontrado' : 'Nenhum evento neste dia'}
          </h3>
          <p className="mx-auto mb-0 mt-2 max-w-xs text-sm leading-6 text-slate-500">
            {isFiltered
              ? 'Ajuste a busca ou o filtro para visualizar outros eventos.'
              : 'Crie a primeira celebração ou atividade para esta data.'}
          </p>
          <button
            type="button"
            onClick={isFiltered ? onClearFilters : onCreate}
            className="mt-5 h-11 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-[0.98]"
          >
            {isFiltered ? 'Limpar filtros' : 'Criar evento'}
          </button>
        </div>
      </div>
    );
  }

  const highlightedOccurrenceId = events.find((event) => !hasEventFinished(event, now))?.occurrenceId;
  return (
    <TimelineEventos
      events={events}
      now={new Date()}
      variant="admin"
      onSelect={onSelect}
      highlightedOccurrenceId={highlightedOccurrenceId}
      renderActions={(event) => {
        const menuKey = `${event.occurrenceId}-${event.start}`;
        return (
          <>
            <div className="hidden items-center gap-1 sm:flex">
              <button
                type="button"
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation();
                  onDuplicate(event);
                }}
                aria-label={`Duplicar ${event.title}`}
                title="Duplicar"
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-amber-50 hover:text-amber-700"
              >
                <Copy size={15} />
              </button>
              <button
                type="button"
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation();
                  onSelect(event);
                }}
                aria-label={`Editar ${event.title}`}
                title="Editar"
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <Pencil size={15} />
              </button>
            </div>
            <div className="sm:hidden">
              <button
                type="button"
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation();
                  setOpenMenu((current) => (current === menuKey ? null : menuKey));
                }}
                aria-label={`Ações de ${event.title}`}
                aria-expanded={openMenu === menuKey}
                className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"
              >
                <MoreHorizontal size={19} />
              </button>
              {openMenu === menuKey ? (
                <div className="absolute right-3 top-12 z-20 grid min-w-36 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                  <button
                    type="button"
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      setOpenMenu(null);
                      onSelect(event);
                    }}
                    className="flex h-10 items-center gap-2 rounded-lg px-3 text-left text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil size={14} /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      setOpenMenu(null);
                      onDuplicate(event);
                    }}
                    aria-label={`Duplicar ${event.title}`}
                    className="flex h-10 items-center gap-2 rounded-lg px-3 text-left text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-800"
                  >
                    <Copy size={14} /> Duplicar
                  </button>
                </div>
              ) : null}
            </div>
          </>
        );
      }}
    />
  );
}
