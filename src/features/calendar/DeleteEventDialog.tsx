import { AlertTriangle, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { CalendarEvent } from "../../shared/api/events";

export function DeleteEventDialog({ event, pending, onCancel, onConfirm }: { event: CalendarEvent | null; pending: boolean; onCancel: () => void; onConfirm: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!event) return;
    cancelRef.current?.focus();
    const listener = (keyboardEvent: KeyboardEvent) => keyboardEvent.key === "Escape" && !pending && onCancel();
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [event, onCancel, pending]);
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-[2px]" onMouseDown={(mouseEvent) => mouseEvent.target === mouseEvent.currentTarget && !pending && onCancel()}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="delete-event-title" aria-describedby="delete-event-description" className="w-full max-w-sm rounded-[1.5rem] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-red-50 text-red-600"><AlertTriangle size={20} /></span>
          <button type="button" aria-label="Fechar confirmação" onClick={onCancel} disabled={pending} className="grid h-9 w-9 place-items-center rounded-full bg-slate-50 p-0 text-slate-500 hover:bg-slate-100"><X size={17} /></button>
        </div>
        <h2 id="delete-event-title" className="mb-0 mt-4 text-lg font-bold">Excluir evento?</h2>
        <p id="delete-event-description" className="mb-0 mt-2 text-sm leading-6 text-slate-500">“{event.title}” será removido da agenda. Esta ação não poderá ser desfeita.</p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={pending} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Cancelar</button>
          <button type="button" onClick={onConfirm} disabled={pending} className="rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">{pending ? "Excluindo..." : "Excluir"}</button>
        </div>
      </section>
    </div>
  );
}
