import { AlertTriangle, Clock3, MapPin, Repeat2, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { CalendarEvent } from "../../../../shared/api/events";

export function DeleteEventDialog({ event, pending, onCancel, onConfirm }: { event: CalendarEvent | null; pending: boolean; onCancel: () => void; onConfirm: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!event) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();
    const listener = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "Escape" && !pending) {
        onCancel();
        return;
      }
      if (keyboardEvent.key !== "Tab") return;
      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ?? [],
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (keyboardEvent.shiftKey && document.activeElement === first) {
        keyboardEvent.preventDefault();
        last.focus();
      } else if (!keyboardEvent.shiftKey && document.activeElement === last) {
        keyboardEvent.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", listener);
    return () => {
      document.removeEventListener("keydown", listener);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [event, onCancel, pending]);
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-slate-950/45 backdrop-blur-[2px] sm:grid sm:place-items-center sm:p-4" onMouseDown={(mouseEvent) => mouseEvent.target === mouseEvent.currentTarget && !pending && onCancel()}>
      <section ref={dialogRef} role="alertdialog" aria-modal="true" aria-labelledby="delete-event-title" aria-describedby="delete-event-description" className="w-full rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-2xl sm:max-w-sm sm:rounded-2xl sm:pb-5">
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-red-50 text-red-600"><AlertTriangle size={20} /></span>
          <button type="button" aria-label="Fechar confirmação" onClick={onCancel} disabled={pending} className="grid h-11 w-11 place-items-center rounded-full bg-slate-50 p-0 text-slate-500 hover:bg-slate-100"><X size={17} /></button>
        </div>
        <h2 id="delete-event-title" className="mb-0 mt-4 text-lg font-bold">Excluir evento?</h2>
        <p id="delete-event-description" className="mb-0 mt-2 text-sm leading-6 text-slate-500">Confirme os dados antes de remover este evento da agenda.</p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <strong className="block text-sm text-slate-950">{event.title}</strong>
          <p className="m-0 mt-2 flex items-center gap-2 text-xs text-slate-600"><Clock3 size={14} className="text-slate-400" />{formatEventDateTime(event.start)}</p>
          <p className="m-0 mt-1.5 flex items-center gap-2 text-xs text-slate-600"><MapPin size={14} className="text-slate-400" />{event.location || "Local a definir"}</p>
          {event.repeat !== "none" ? <p className="m-0 mt-1.5 flex items-center gap-2 text-xs font-bold text-amber-800"><Repeat2 size={14} />Evento {event.repeat === "weekly" ? "semanal" : "mensal"}</p> : null}
        </div>
        <p className="mb-0 mt-3 text-xs font-semibold leading-5 text-red-700">{event.repeat === "none" ? "Esta ação não poderá ser desfeita." : "Todas as ocorrências desta série serão excluídas. Esta ação não poderá ser desfeita."}</p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={pending} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Cancelar</button>
          <button type="button" onClick={onConfirm} disabled={pending} className="rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">{pending ? "Excluindo..." : "Excluir"}</button>
        </div>
      </section>
    </div>
  );
}

function formatEventDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value)).replace(/\./g, "");
}
