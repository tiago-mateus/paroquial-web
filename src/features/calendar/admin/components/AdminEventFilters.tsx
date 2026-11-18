import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { fieldActiveClass, fieldClasses } from '../../../../shared/styles/controls';

type AdminEventFiltersProps = {
  scope?: 'day' | 'week' | 'month';
  search: string;
  type: string;
  mobileOpen: boolean;
  isFiltered: boolean;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onClear: () => void;
  onCloseMobile: () => void;
  resultCount?: number;
  inline?: boolean;
  onOpen?: () => void;
};

const options = [['all', 'Todos os tipos'], ['missa', 'Missas'], ['novena', 'Novenas'], ['reuniao', 'Reuniões'], ['encontro', 'Encontros'], ['adoracao', 'Adorações'], ['movimento', 'Movimentos'], ['outro', 'Outros']];

const scopeText = {
  day: { search: 'Buscar eventos nesta data', applies: 'à data selecionada' },
  week: { search: 'Buscar eventos nesta semana', applies: 'à semana exibida' },
  month: { search: 'Buscar eventos neste mês', applies: 'ao mês exibido' },
} as const;

// Busca e tipo usam a geometria compartilhada de barras de ferramentas (md, 44 px) e a borda de
// controle (3,3:1). O estado "filtro aplicado" troca a borda para a cor primária.
const fieldClass = fieldClasses.md;
const idleFieldClass = '';
const activeFieldClass = fieldActiveClass;

function FilterFields({ search, type, scope = 'day', onSearchChange, onTypeChange, inline = false }: Pick<AdminEventFiltersProps, 'search' | 'type' | 'scope' | 'onSearchChange' | 'onTypeChange' | 'inline'>) {
  return (
    <div className={inline ? 'agenda-filter-fields grid min-w-0 flex-1 gap-2 md:grid-cols-[minmax(0,1fr)_11rem]' : 'grid gap-4 md:grid-cols-[minmax(0,1fr)_11rem]'}>
      <label className="block min-w-0"><span className={inline ? 'sr-only' : 'mb-2 block text-base font-medium text-ink'}>{scopeText[scope].search}</span><span className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} aria-hidden="true" /><input type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} aria-label={scopeText[scope].search} className={`${fieldClass} pl-10 pr-3 placeholder:text-muted ${search.trim() ? activeFieldClass : idleFieldClass}`} placeholder="Título, local ou descrição" /></span></label>
      <label className={inline ? 'agenda-inline-type hidden md:block' : 'block min-w-0'}><span className={inline ? 'sr-only' : 'mb-2 block text-base font-medium text-ink'}>Tipo de evento</span><span className="relative block"><select value={type} onChange={(event) => onTypeChange(event.target.value)} className={`${fieldClass} appearance-none pl-3 pr-9 ${type !== 'all' ? `${activeFieldClass} font-semibold` : idleFieldClass}`} aria-label="Filtrar por tipo">{options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" size={16} aria-hidden="true" /></span></label>
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
      previous?.focus({ preventScroll: true });
    };
  }, [mobileOpen, onCloseMobile]);

  const fields = <FilterFields {...props} inline={false} />;
  return (
    <>
      {props.inline ? <div className="agenda-inline-filters flex items-center gap-2 border-b border-line pb-3 [&>button]:flex [&>button]:min-h-11 [&>button]:items-center [&>button]:justify-center [&>button]:gap-2 [&>button]:rounded-xl [&>button]:px-2 [&>button]:text-[15px] [&>button]:text-primary [&>button:hover]:bg-selection/35 md:[&>button]:hidden"><FilterFields {...props} inline /><button type="button" onClick={props.onOpen} aria-label="Buscar e filtrar eventos"><SlidersHorizontal size={20} strokeWidth={1.5} aria-hidden="true" />Filtrar</button></div> : null}
      {props.mobileOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center md:items-center md:p-6" onClick={props.onCloseMobile}>
          <div className="absolute inset-0 bg-black/30" />
          <section ref={panelRef} role="dialog" aria-modal="true" aria-label="Buscar e filtrar eventos" onClick={(event) => event.stopPropagation()} className="relative max-h-[min(90dvh,34rem)] w-full overflow-y-auto rounded-t-2xl bg-surface px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3 shadow-2xl md:max-w-xl md:rounded-2xl md:p-6">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line md:hidden" />
            <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="m-0 text-xl font-semibold">Buscar e filtrar</h2><p className="mb-0 mt-1 text-sm leading-5 text-muted">Os filtros se aplicam {scopeText[props.scope ?? 'day'].applies}.</p></div><button type="button" onClick={props.onCloseMobile} aria-label="Fechar filtros" className="grid size-11 shrink-0 place-items-center rounded-lg bg-canvas text-muted hover:bg-selection"><X size={18} aria-hidden="true" /></button></div>
            {fields}
            <div className="mt-6 flex items-center gap-3">
              {props.isFiltered ? <button type="button" onClick={props.onClear} className="min-h-12 rounded-lg border border-line px-4 text-sm font-semibold text-primary hover:bg-selection">Limpar</button> : null}
              <button type="button" onClick={props.onCloseMobile} className="min-h-12 flex-1 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover">Ver resultados{props.resultCount !== undefined ? ` (${props.resultCount})` : ''}</button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
