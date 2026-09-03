import { LoaderCircle, Trash2, X } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useRef } from "react";

type AdminFormDialogProps = {
  open: boolean;
  eyebrow: string;
  title: string;
  submitLabel: string;
  pending?: boolean;
  children: ReactNode;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDelete?: () => void;
};

export function AdminFormDialog({ open, eyebrow, title, submitLabel, pending = false, children, onClose, onSubmit, onDelete }: AdminFormDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLFormElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/40 md:items-center md:p-5" onMouseDown={onClose}>
      <form ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="admin-form-title" onSubmit={onSubmit} onMouseDown={(event) => event.stopPropagation()} className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl md:rounded-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 md:px-5">
          <div><p className="m-0 text-[0.65rem] font-bold text-amber-700">{eyebrow}</p><h2 id="admin-form-title" className="m-0 mt-0.5 text-lg font-bold">{title}</h2></div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Fechar editor" className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-500"><X size={17} /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5">{children}</div>
        <footer className="flex items-center gap-2 border-t border-slate-100 bg-white px-4 py-3 md:px-5">
          {onDelete ? <button type="button" onClick={onDelete} disabled={pending} className="grid h-11 w-11 place-items-center rounded-xl text-red-600 hover:bg-red-50" aria-label="Excluir"><Trash2 size={17} /></button> : null}
          <button type="button" onClick={onClose} disabled={pending} className="ml-auto h-11 rounded-xl px-4 text-xs font-bold text-slate-500">Cancelar</button>
          <button type="submit" disabled={pending} className="inline-flex h-11 min-w-28 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white disabled:opacity-60">{pending ? <LoaderCircle size={15} className="animate-spin" /> : null}{submitLabel}</button>
        </footer>
      </form>
    </div>
  );
}

export const fieldClassName = "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100";
export const labelClassName = "text-xs font-bold text-slate-700";
