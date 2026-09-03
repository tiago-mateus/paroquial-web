import { CalendarPlus, ExternalLink, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminPageHeader } from '../../../admin/AdminPageHeader';

type AdminCalendarHeaderProps = {
  publicHref: string;
  isFiltered: boolean;
  onCreate: () => void;
  onOpenFilters: () => void;
};

export function AdminCalendarHeader({ publicHref, isFiltered, onCreate, onOpenFilters }: AdminCalendarHeaderProps) {
  return (
    <>
      <AdminPageHeader
        title="Agenda"
        description="Cadastre e mantenha a programação publicada para a comunidade."
        actions={
          <>
            <Link to={publicHref} className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
              <ExternalLink size={15} /> Ver agenda pública
            </Link>
            <button type="button" onClick={onCreate} className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-[0.98]">
              <CalendarPlus size={16} /> Novo evento
            </button>
          </>
        }
      />

      <header className="flex items-center gap-1 border-b border-slate-200/80 bg-white px-3 py-2 md:hidden">
        <div className="mr-auto min-w-0">
          <h1 className="m-0 text-[1.25rem] font-bold leading-none  text-slate-950">Agenda</h1>
          <p className="m-0 mt-2 text-xs font-medium leading-tight text-slate-500">Gerencie a programação</p>
        </div>
        <Link
          to={publicHref}
          aria-label="Ver agenda pública"
          title="Ver agenda pública"
          className="flex w-[3.7rem] flex-none flex-col items-center gap-1 text-[0.62rem] font-semibold text-slate-500 transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white"><ExternalLink size={18} /></span>
        </Link>
        <button
          type="button"
          onClick={onOpenFilters}
          aria-label="Buscar e filtrar eventos"
          className={`relative grid h-11 w-11 flex-none place-items-center rounded-xl border transition ${isFiltered ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-500'}`}
        >
          <SlidersHorizontal size={18} />
          {isFiltered ? <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-600" /> : null}
        </button>
      </header>
    </>
  );
}
