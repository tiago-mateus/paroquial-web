import { Search, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

type AdminEventFiltersProps = {
  search: string;
  type: string;
  mobileOpen: boolean;
  isFiltered: boolean;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onClear: () => void;
  onCloseMobile: () => void;
};

const options = [['all', 'Todos os tipos'], ['missa', 'Missas'], ['novena', 'Novenas'], ['reuniao', 'Reuniões'], ['encontro', 'Encontros'], ['adoracao', 'Adorações'], ['movimento', 'Movimentos'], ['outro', 'Outros']];

function FilterFields({ search, type, isFiltered, onSearchChange, onTypeChange, onClear }: Omit<AdminEventFiltersProps, 'mobileOpen' | 'onCloseMobile'>) {
  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_13rem_auto] md:items-center">
      <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><span className="sr-only">Buscar eventos</span><input value={search} onChange={(event) => onSearchChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-amber-400 focus:ring-3 focus:ring-amber-100" placeholder="Buscar evento ou local" /></label>
      <label><span className="sr-only">Filtrar por tipo</span><select value={type} onChange={(event) => onTypeChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-amber-400 focus:ring-3 focus:ring-amber-100">{options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      {isFiltered ? <button type="button" onClick={onClear} className="h-11 px-2 text-xs font-bold text-amber-800">Limpar</button> : <span className="hidden w-12 md:block" />}
    </div>
  );
}

export function AdminEventFilters(props: AdminEventFiltersProps) {
  const panelRef = useRef<HTMLElement>(null);
  const { mobileOpen, onCloseMobile } = props;

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseMobile();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ) ?? [],
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
  }, [mobileOpen, onCloseMobile]);

  const fields = <FilterFields {...props} />;
  return (
    <>
      <div className="hidden border-b border-slate-200 bg-slate-50/70 px-5 py-3 md:block">{fields}</div>
      {props.mobileOpen ? (
        <div className="fixed inset-0 z-[80] md:hidden" onClick={props.onCloseMobile}>
          <div className="absolute inset-0 bg-slate-950/30" />
          <section ref={panelRef} role="dialog" aria-modal="true" aria-label="Buscar e filtrar eventos" onClick={(event) => event.stopPropagation()} className="absolute inset-x-0 bottom-0 max-h-[min(90dvh,34rem)] overflow-y-auto rounded-t-2xl bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3 shadow-2xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />
            <div className="mb-4 flex items-center justify-between"><div><p className="m-0 text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-amber-700">Refine a agenda</p><h2 className="m-0 mt-0.5 text-lg font-bold">Buscar e filtrar</h2></div><button type="button" onClick={props.onCloseMobile} aria-label="Fechar filtros" className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-600"><X size={17} /></button></div>
            {fields}
            <button type="button" onClick={props.onCloseMobile} className="mt-4 h-11 w-full rounded-xl bg-slate-950 text-sm font-bold text-white">Ver resultados</button>
          </section>
        </div>
      ) : null}
    </>
  );
}
