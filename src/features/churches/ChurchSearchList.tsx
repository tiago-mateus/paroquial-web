import { ChevronRight, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicChurch } from "../../shared/api/churches";
import { classNames } from "../../shared/lib/classNames";
import { ChurchThumbnail } from "./ChurchThumbnail";

type Filter = "all" | "matriz" | "capela";

export function ChurchSearchList({ churches, selectedId, onSelect, autoFocus = false, distances }: { churches: PublicChurch[]; selectedId?: string; onSelect: (church: PublicChurch) => void; autoFocus?: boolean; distances?: Map<string, number | undefined> }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const hasMatrix = churches.some((church) => church.tipo === "matriz");
  const hasChapels = churches.some((church) => church.tipo !== "matriz");
  const showFilters = hasMatrix && hasChapels;

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const filteredChurches = useMemo(() => {
    const normalizedQuery = normalize(query);
    return churches.filter((church) => {
      const matchesFilter = filter === "all" || (filter === "matriz" ? church.tipo === "matriz" : church.tipo !== "matriz");
      const matchesQuery = !normalizedQuery || normalize(`${church.nome} ${church.endereco}`).includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [churches, filter, query]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid gap-2.5 border-t border-slate-100 px-4 pb-3 pt-3">
        <label className="relative block">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar igreja ou endereço"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-500/15"
          />
          {query ? (
            <button type="button" onClick={() => setQuery("")} aria-label="Limpar busca" className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg bg-transparent p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X size={15} />
            </button>
          ) : null}
        </label>

        {showFilters ? (
          <div className="flex gap-1.5" aria-label="Filtrar igrejas">
            {(["all", "matriz", "capela"] as const).map((value) => (
              <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={classNames(
                "min-h-9 rounded-full border px-3 py-1 text-[0.68rem] font-bold transition",
                filter === value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              )}>
                {value === "all" ? "Todas" : value === "matriz" ? "Matriz" : "Capelas"}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-1">
        {filteredChurches.length ? filteredChurches.map((church) => {
          const selected = church.id === selectedId;
          const address = church.endereco?.trim() || "Endereço a confirmar";
          return (
            <button
              key={church.id}
              type="button"
              onClick={() => onSelect(church)}
              aria-current={selected ? "true" : undefined}
              className={classNames(
                "mb-1 grid w-full grid-cols-[2.5rem_minmax(0,1fr)_1rem] items-center gap-3 rounded-xl px-2 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40",
                selected ? "bg-amber-50" : "hover:bg-slate-50",
              )}
            >
              <ChurchThumbnail src={church.urlImg} name={church.nome} className="h-10 w-10 rounded-xl" />
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-[0.58rem] font-extrabold uppercase tracking-[0.1em] text-amber-700"><span>{church.tipo === "matriz" ? "Matriz" : church.tipo === "capela" ? "Capela" : "Comunidade"}</span>{distances?.get(church.id) !== undefined ? <><span className="h-1 w-1 rounded-full bg-slate-300" /><span className="normal-case tracking-normal text-slate-400">{formatDistance(distances.get(church.id)!)} de você</span></> : null}</span>
                <strong className="mt-0.5 block truncate text-sm font-semibold leading-tight text-slate-950">{church.nome}</strong>
                <span className="mt-1 block truncate text-xs text-slate-500">{address}</span>
              </span>
              <ChevronRight size={15} className={selected ? "text-amber-700" : "text-slate-300"} />
            </button>
          );
        }) : (
          <div className="grid min-h-40 place-content-center px-5 text-center">
            <strong className="text-sm text-slate-800">Nenhuma igreja encontrada.</strong>
            <p className="mt-1 text-xs leading-5 text-slate-500">Tente outro nome, endereço ou filtro.</p>
          </div>
        )}
      </div>
      <p className="m-0 border-t border-slate-100 px-4 py-2.5 text-[0.68rem] font-semibold text-slate-400">{filteredChurches.length} de {churches.length} igrejas</p>
    </div>
  );
}

function formatDistance(value: number) { return value < 1 ? `${Math.round(value * 1000)} m` : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`; }

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}
