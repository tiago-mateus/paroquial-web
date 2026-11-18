import { ChevronLeft, ChevronRight, Expand, LocateFixed } from "lucide-react";
import { useEffect, useRef } from "react";
import type { PublicChurch } from "../../shared/api/churches";
import { getChurchDirectionsHref, hasValidChurchCoordinates } from "../../shared/api/churches";
import { DirectionsLink } from "../../shared/components/DirectionsLink";
import { IconButton } from "../../shared/components/IconButton";

type Props = {
  churches: PublicChurch[];
  selectedId: string;
  hidden?: boolean;
  locating: boolean;
  onSelect: (church: PublicChurch) => void;
  onDetails: () => void;
  onOverview: () => void;
  onLocate: () => void;
  onHeightChange: (height: number) => void;
};

export function ChurchCarousel({ churches, selectedId, hidden = false, locating, onSelect, onDetails, onOverview, onLocate, onHeightChange }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const settleRef = useRef<number | undefined>(undefined);
  const alignedRef = useRef(false);
  const currentRef = useRef({ churches, selectedId, onSelect });
  const index = Math.max(0, churches.findIndex((church) => church.id === selectedId));

  useEffect(() => { currentRef.current = { churches, selectedId, onSelect }; }, [churches, selectedId, onSelect]);
  useEffect(() => {
    const rail = railRef.current;
    const card = rail?.children[index] as HTMLElement | undefined;
    if (!rail || !card || hidden) return;
    const resize = () => { if (card.offsetHeight) rail.style.height = `${card.offsetHeight}px`; };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(card);
    return () => observer.disconnect();
  }, [index, hidden, churches]);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver(() => {
      if (root.offsetHeight) onHeightChange(root.offsetHeight);
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [onHeightChange]);
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || hidden) { alignedRef.current = false; return; }
    const align = (animate: boolean) => {
      window.clearTimeout(settleRef.current);
      const target = index * rail.clientWidth;
      if (Math.abs(rail.scrollLeft - target) > 1) rail.scrollTo({ left: target, behavior: animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "instant" });
    };
    align(alignedRef.current);
    alignedRef.current = true;
    let lastWidth = rail.clientWidth;
    const observer = new ResizeObserver(() => {
      if (rail.clientWidth !== lastWidth) { lastWidth = rail.clientWidth; align(false); }
    });
    observer.observe(rail);
    return () => { observer.disconnect(); window.clearTimeout(settleRef.current); };
  }, [index, hidden, churches.length]);

  function moveTo(nextIndex: number) {
    const church = churches[nextIndex];
    if (church) onSelect(church);
  }

  return <section ref={rootRef} hidden={hidden} aria-label="Igrejas cadastradas" aria-roledescription="carrossel" className="absolute bottom-7 left-3 right-3 z-10 overflow-hidden rounded-xl border border-line bg-surface sm:left-5 sm:right-auto sm:w-96">
    <div ref={railRef} data-church-carousel tabIndex={0} aria-label="Passe os cards ou use as setas para explorar as igrejas" className="flex snap-x snap-mandatory items-start overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus" onKeyDown={(event) => {
      if (event.target !== event.currentTarget) return;
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        moveTo(event.key === "Home" ? 0 : event.key === "End" ? churches.length - 1 : index + (event.key === "ArrowLeft" ? -1 : 1));
      }
    }} onScroll={() => {
      window.clearTimeout(settleRef.current);
      settleRef.current = window.setTimeout(() => {
        const rail = railRef.current;
        if (!rail?.clientWidth) return;
        const current = currentRef.current;
        const nextIndex = Math.round(rail.scrollLeft / rail.clientWidth);
        const next = current.churches[nextIndex];
        if (next && next.id !== current.selectedId) current.onSelect(next);
      }, 140);
    }}>
      {churches.map((church, cardIndex) => {
        const active = church.id === selectedId;
        const coordinates = hasValidChurchCoordinates(church);
        return <article key={church.id} inert={!active} aria-hidden={!active} aria-roledescription="slide" aria-label={`${cardIndex + 1} de ${churches.length}`} className="w-full min-w-0 shrink-0 snap-center px-4 pb-2 pt-3">
          <h2 className="m-0 font-display text-xl font-medium leading-6 text-primary [overflow-wrap:anywhere]">{church.nome}</h2>
          <p className="mb-0 mt-0.5 text-sm leading-5 text-muted [overflow-wrap:anywhere]">{church.endereco?.trim() || "Endereço a confirmar"}</p>
          {!coordinates ? <p className="mb-0 mt-1 text-[13px] leading-5 text-muted">Sem localização no mapa.</p> : null}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <DirectionsLink href={getChurchDirectionsHref(church)} destination={church.nome} />
            <button type="button" data-church-details onClick={onDetails} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-selection focus-visible:outline-2 focus-visible:outline-focus">Ver detalhes</button>
          </div>
        </article>;
      })}
    </div>
    <div className="mx-3 flex items-center gap-1 border-t border-line py-1">
      <button type="button" onClick={onOverview} className="mr-auto inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-[13px] font-semibold text-primary hover:bg-selection focus-visible:outline-2 focus-visible:outline-focus"><Expand size={16} aria-hidden="true" />Visão geral</button>
      <IconButton onClick={onLocate} disabled={locating} label={locating ? "Localizando…" : "Perto de mim"} title="Perto de mim" icon={LocateFixed} tone="primary" />
      <IconButton onClick={() => moveTo(index - 1)} disabled={index === 0} label="Igreja anterior" icon={ChevronLeft} iconSize={20} tone="primary" className="disabled:opacity-30 disabled:hover:bg-transparent" />
      <span aria-hidden="true" className="min-w-8 text-center text-[13px] font-medium tabular-nums text-muted">{index + 1}/{churches.length}</span>
      <IconButton onClick={() => moveTo(index + 1)} disabled={index === churches.length - 1} label="Próxima igreja" icon={ChevronRight} iconSize={20} tone="primary" className="disabled:opacity-30 disabled:hover:bg-transparent" />
    </div>
    <span role="status" aria-live="polite" className="sr-only">{index + 1} de {churches.length}: {churches[index]?.nome}</span>
  </section>;
}
