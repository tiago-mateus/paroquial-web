import { ArrowLeft, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { PublicChurch } from "../../shared/api/churches";
import type { CalendarEvent } from "../../shared/api/events";
import { ChurchSearchList } from "./ChurchSearchList";
import { ChurchSummary } from "./ChurchSummary";
import { IconButton } from "../../shared/components/IconButton";

type Props = {
  mode: "list" | "details" | null;
  church?: PublicChurch;
  churches: PublicChurch[];
  tenantSlug: string;
  distances: Map<string, number | undefined>;
  nextEvent?: CalendarEvent;
  eventsLoading?: boolean;
  locating: boolean;
  carouselHeight: number;
  restoreFocus?: boolean;
  onSelect: (church: PublicChurch) => void;
  onClose: () => void;
  onLocate: () => void;
};

export function ChurchesExplorerPanel({ mode, church, churches, tenantSlug, distances, nextEvent, eventsLoading = false, locating, carouselHeight, restoreFocus = true, onSelect, onClose, onLocate }: Props) {
  const panelRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const previousMode = useRef<typeof mode>(null);
  useEffect(() => {
    if (mode) {
      if (mode !== previousMode.current) openerRef.current = document.activeElement as HTMLElement | null;
      const target = mode === "list" ? panelRef.current?.querySelector<HTMLInputElement>("input") : panelRef.current?.querySelector<HTMLElement>("h2");
      target?.focus({ preventScroll: true });
    } else if (previousMode.current) {
      const target = openerRef.current?.isConnected && !openerRef.current.closest("[hidden], [inert]")
        ? openerRef.current
        : document.querySelector<HTMLElement>(previousMode.current === "details" ? "[data-church-carousel] article:not([inert]) [data-church-details]" : "[data-church-search]");
      if (restoreFocus) target?.focus({ preventScroll: true });
      openerRef.current = null;
    }
    previousMode.current = mode;
  }, [mode, restoreFocus]);
  useEffect(() => {
    if (!mode) return;
    const handleEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mode, onClose]);
  if (!mode) return null;

  const search = mode === "list";
  return <section ref={panelRef} id="church-explorer-panel" aria-label={search ? "Buscar igrejas" : "Detalhes da igreja"} style={search ? { maxHeight: `calc(100% - ${carouselHeight + 52}px)` } : undefined} className={`absolute left-3 z-20 flex flex-col overflow-hidden rounded-xl border border-line bg-surface sm:left-5 sm:right-auto sm:w-96 ${search ? "right-16 top-3" : "bottom-7 right-3 max-h-[65%]"}`}>
    {search ? <ChurchSearchList churches={churches} selectedId={church?.id} onSelect={onSelect} distances={distances} onClose={onClose} onLocate={onLocate} locating={locating} /> : church ? <>
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-3 py-1">
        <IconButton onClick={onClose} label="Voltar ao carrossel" icon={ArrowLeft} tone="primary" />
        <p className="m-0 min-w-0 flex-1 text-sm font-semibold text-muted">Detalhes da igreja</p>
        <IconButton onClick={onClose} label="Fechar detalhes" icon={X} />
      </header>
      <div className="min-h-0 overflow-y-auto overscroll-contain">
        <ChurchSummary church={church} distanceKm={distances.get(church.id)} nextEvent={nextEvent} tenantSlug={tenantSlug} plain />
        {eventsLoading ? <p role="status" className="m-0 px-4 pb-4 text-sm text-muted">Carregando próximo evento...</p> : null}
      </div>
    </> : null}
  </section>;
}
