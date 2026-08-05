import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import type { PublicChurch } from "../../shared/api/churches";
import { ChurchSearchList } from "./ChurchSearchList";

export function ChurchesMobileSheet({ open, churches, selectedId, onSelect, onClose, distances }: { open: boolean; churches: PublicChurch[]; selectedId?: string; onSelect: (church: PublicChurch) => void; onClose: () => void; distances?: Map<string, number | undefined> }) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;
  return (
    <section className="fixed inset-0 z-[70] flex flex-col bg-stone-50 md:hidden" aria-label="Lista de igrejas">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+12px)]">
        <button type="button" onClick={onClose} aria-label="Voltar ao mapa" className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 p-0 text-slate-700"><ArrowLeft size={18} /></button>
        <div><p className="m-0 text-[0.62rem] font-extrabold uppercase tracking-[0.15em] text-amber-700">Localizador</p><h1 className="m-0 text-lg font-bold text-slate-950">Igrejas e capelas</h1></div>
      </header>
      <ChurchSearchList
        churches={churches}
        selectedId={selectedId}
        autoFocus
        distances={distances}
        onSelect={(church) => {
          onSelect(church);
          onClose();
        }}
      />
    </section>
  );
}
