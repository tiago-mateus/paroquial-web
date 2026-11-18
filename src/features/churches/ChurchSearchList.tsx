import { ArrowLeft, ChevronRight, LocateFixed, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { PublicChurch } from "../../shared/api/churches";
import { IconButton } from "../../shared/components/IconButton";
import { formatDistance, normalizeChurchSearch } from "./churches.utils";

type Props = {
  churches: PublicChurch[];
  selectedId?: string;
  onSelect: (church: PublicChurch) => void;
  autoFocus?: boolean;
  distances?: Map<string, number | undefined>;
  onClose?: () => void;
  onBack?: () => void;
  onLocate?: () => void;
  locating?: boolean;
};

export function ChurchSearchList({ churches, selectedId, onSelect, autoFocus = false, distances, onClose, onBack, onLocate, locating = false }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filtersId = useId();
  const filters = [
    { value: "all", label: "Todas" },
    ...(churches.some((church) => church.tipo === "matriz") ? [{ value: "matriz", label: "Matriz" }] : []),
    ...(churches.some((church) => church.tipo === "capela") ? [{ value: "capela", label: "Capelas" }] : []),
    ...(churches.some((church) => !["matriz", "capela"].includes(church.tipo)) ? [{ value: "other", label: "Comunidades" }] : []),
  ];
  useEffect(() => { if (autoFocus) inputRef.current?.focus(); }, [autoFocus]);
  const filteredChurches = useMemo(() => churches.filter((church) => {
    const matchesFilter = filter === "all" || (filter === "other" ? !["matriz", "capela"].includes(church.tipo) : church.tipo === filter);
    return matchesFilter && normalizeChurchSearch(`${church.nome} ${church.endereco}`).includes(normalizeChurchSearch(query));
  }), [churches, filter, query]);
  const nearby = Boolean(distances && [...distances.values()].some((distance) => distance !== undefined));

  return (
    <div className="flex min-h-0 min-w-0 flex-col" onKeyDown={(event) => {
      if (event.key === "Escape" && filtersOpen) {
        event.stopPropagation();
        event.preventDefault();
        setFiltersOpen(false);
        filterButtonRef.current?.focus();
      }
    }}>
      <div className="shrink-0 border-b border-line px-3 pt-3">
        <div className="flex items-center gap-2">
          {onBack ? <IconButton onClick={onBack} label="Voltar à igreja selecionada" icon={ArrowLeft} /> : null}
          <div className="relative min-w-0 flex-1">
            <label htmlFor={`${filtersId}-search`} className="sr-only">Buscar igreja ou endereço</label>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={17} />
            <input id={`${filtersId}-search`} ref={inputRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome ou endereço" className={`min-h-11 w-full rounded-lg border border-control-border bg-canvas pl-10 text-base text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-focus [&::-webkit-search-cancel-button]:appearance-none ${query ? "pr-11" : "pr-3"}`} />
            {query ? <IconButton onClick={() => { setQuery(""); inputRef.current?.focus(); }} label="Limpar busca" icon={X} iconSize={16} className="absolute right-0 top-1/2 -translate-y-1/2" /> : null}
          </div>
          {onClose ? <IconButton onClick={onClose} label="Fechar busca" icon={X} /> : null}
        </div>
        <div className="flex min-h-12 items-center justify-between gap-2">
          {filters.length > 2 ? <button ref={filterButtonRef} type="button" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen} aria-controls={filtersId} className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold hover:bg-selection focus-visible:outline-2 focus-visible:outline-focus ${filter !== "all" || filtersOpen ? "text-primary" : "text-muted"}`}><SlidersHorizontal size={16} aria-hidden="true" />{filter === "all" ? "Filtrar" : filters.find((item) => item.value === filter)?.label}</button> : <span />}
          {onLocate ? <button type="button" onClick={onLocate} disabled={locating} aria-pressed={nearby} aria-label={locating ? "Localizando…" : "Ordenar igrejas perto de mim"} className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium hover:bg-selection focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-wait disabled:opacity-60 ${nearby ? "text-primary" : "text-muted"}`}><LocateFixed size={16} aria-hidden="true" />{locating ? "Localizando…" : "Perto de mim"}</button> : null}
        </div>
        <div id={filtersId} hidden={!filtersOpen}>
          <div role="group" aria-label="Filtrar igrejas" className="flex flex-wrap gap-1 pb-2">
            {filters.map(({ value, label }) => <button key={value} type="button" onClick={() => { setFilter(value); setFiltersOpen(false); filterButtonRef.current?.focus(); }} aria-pressed={filter === value} className={`min-h-11 rounded-lg px-3 text-sm focus-visible:outline-2 focus-visible:outline-focus ${filter === value ? "bg-selection font-bold text-primary" : "font-medium text-muted hover:bg-canvas"}`}>{label}</button>)}
          </div>
        </div>
      </div>
      <p role="status" aria-live="polite" className="sr-only">{filteredChurches.length} de {churches.length} igrejas{nearby ? ", ordenadas por proximidade" : ""}</p>
      <div className="min-h-0 overflow-y-auto overscroll-contain px-3 py-1">
        <ul className="m-0 list-none divide-y divide-line p-0">
          {filteredChurches.map((church) => {
            const selected = church.id === selectedId;
            const distance = distances?.get(church.id);
            return <li key={church.id}>
              <button type="button" onClick={() => onSelect(church)} aria-current={selected ? "true" : undefined} className={`grid min-h-18 w-full grid-cols-[minmax(0,1fr)_1rem] items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-focus focus-visible:-outline-offset-2 motion-reduce:transition-none ${selected ? "bg-selection" : "hover:bg-canvas"}`}>
                <span className="min-w-0">
                  <strong className="block text-base font-semibold leading-6 text-ink [overflow-wrap:anywhere]">{church.nome}</strong>
                  <span className="mt-0.5 block text-sm leading-5 text-muted [overflow-wrap:anywhere]">{church.endereco?.trim() || "Endereço a confirmar"}{distance !== undefined ? ` · ${formatDistance(distance)} de você` : ""}</span>
                </span>
                <ChevronRight size={16} aria-hidden="true" className="text-muted" />
              </button>
            </li>;
          })}
        </ul>
        {!filteredChurches.length ? <div className="px-2 py-6 text-center"><p className="m-0 text-base font-semibold text-ink">Nenhuma igreja encontrada.</p><p className="mb-0 mt-1 text-sm leading-5 text-muted">Tente outro nome ou endereço.</p><button type="button" onClick={() => { setQuery(""); setFilter("all"); setFiltersOpen(false); inputRef.current?.focus(); }} className="mt-2 min-h-11 rounded-lg px-3 text-sm font-bold text-primary hover:bg-selection">Limpar busca e filtros</button></div> : null}
      </div>
    </div>
  );
}
