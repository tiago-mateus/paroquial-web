import { DiscardChangesDialog, UnsavedChanges } from "./UnsavedChanges";
import { LoaderCircle, Trash2, X } from "lucide-react";
import type { FormEvent, ReactNode, RefObject } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { buttonClasses } from "../../shared/styles/controls";

type AdminFormDialogProps = {
  open: boolean;
  eyebrow: string;
  title: string;
  submitLabel: string;
  pending?: boolean;
  dirty?: boolean;
  submitDisabled?: boolean;
  submitHint?: string;
  wide?: boolean;
  contentKey?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDelete?: () => void;
};

export function AdminFormDialog({ open, eyebrow, title, submitLabel, pending = false, dirty = false, submitDisabled = false, submitHint, wide = false, contentKey, initialFocusRef, returnFocusRef, children, onClose, onSubmit, onDelete }: AdminFormDialogProps) {
  const titleId = useId();
  const [discardOpen, setDiscardOpen] = useState(false);
  const requestClose = () => {
    if (pending) return;
    if (dirty) setDiscardOpen(true);
    else onClose();
  };
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLFormElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(requestClose);
  onCloseRef.current = requestClose;

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = returnFocusRef?.current ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    (initialFocusRef?.current ?? closeRef.current)?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (Array.from(document.querySelectorAll('[aria-modal="true"]')).at(-1) !== dialogRef.current) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:enabled, input:enabled, select:enabled, textarea:enabled, a[href], summary') ?? []).filter(element =>
        !element.closest('[hidden]') && (element.matches('summary') || !element.closest('details:not([open])')));
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    };
  }, [open, initialFocusRef, returnFocusRef]);

  if (!open) return null;

  return (
    <><div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/30 md:items-center md:p-5" onMouseDown={requestClose}>
      <form ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={pending} onSubmit={onSubmit} onMouseDown={(event) => event.stopPropagation()} className={`admin-theme flex h-dvh w-full flex-col overflow-hidden bg-surface pt-[env(safe-area-inset-top)] shadow-2xl md:h-auto md:max-h-[94dvh] md:rounded-2xl md:pt-0 ${wide ? "md:max-w-5xl" : "md:max-w-3xl"}`}>
        <UnsavedChanges dirty={dirty} />
        <header className="flex items-start justify-between gap-4 border-b border-line bg-surface px-4 py-4 md:px-6 md:py-5">
          <div><h2 id={titleId} className="m-0 font-display text-2xl font-medium leading-tight tracking-tight">{title}</h2>{eyebrow ? <p className="m-0 mt-1 text-sm text-muted">{eyebrow}</p> : null}</div>
          <button ref={closeRef} type="button" onClick={requestClose} aria-label="Fechar formulário" className="grid h-11 w-11 place-items-center rounded-xl bg-transparent text-muted transition hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><X size={17} /></button>
        </header>
        <div key={contentKey} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 md:px-6 md:py-6"><fieldset disabled={pending} className="m-0 min-w-0 border-0 p-0">{children}</fieldset></div>
        <footer className="flex flex-wrap items-center gap-2 border-t border-line bg-surface px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:px-5 md:pb-3">
          {onDelete ? <button type="button" onClick={onDelete} disabled={pending} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-danger hover:bg-danger/10" aria-label="Excluir"><Trash2 size={17} />Excluir</button> : null}
          {submitHint && submitDisabled ? <p className="m-0 w-full text-center text-sm font-semibold text-warning md:text-left">{submitHint}</p> : null}
          <button type="button" onClick={requestClose} disabled={pending} className={`${buttonClasses.secondary.md} ml-auto`}>Cancelar</button>
          <button type="submit" disabled={pending || submitDisabled} className={`${buttonClasses.primary.md} min-w-0 flex-1 disabled:cursor-not-allowed disabled:bg-line disabled:text-muted md:min-w-28 md:flex-none`}>{pending ? <LoaderCircle size={15} className="animate-spin motion-reduce:animate-none" /> : null}{pending ? "Salvando..." : submitLabel}</button>
        </footer>
      </form>
    </div>
    {discardOpen ? <DiscardChangesDialog onStay={() => setDiscardOpen(false)} onLeave={() => { setDiscardOpen(false); onClose(); }} /> : null}
    </>
  );
}
