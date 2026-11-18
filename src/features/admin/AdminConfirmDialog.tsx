import { AdminNotice } from "./AdminNotice";
import { LoaderCircle, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useId, useRef } from 'react';
import { buttonClasses } from '../../shared/styles/controls';

export function AdminConfirmDialog({ open, title, description, pending, error, onClose, onConfirm, children }: { children?: ReactNode; open: boolean; title: string; description: string; pending: boolean; error?: Error | null; onClose: () => void; onConfirm: () => void }) {
  const id = useId();
  const panel = useRef<HTMLElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  const pendingRef = useRef(pending);
  closeRef.current = onClose;
  pendingRef.current = pending;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cancel.current?.focus();
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); if (!pendingRef.current) closeRef.current(); }
      if (event.key !== 'Tab') return;
      const items = Array.from(panel.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
      if (!items.length) { event.preventDefault(); return; }
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panel.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !panel.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', listener);
    return () => {
      document.removeEventListener('keydown', listener); document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
      else document.querySelector<HTMLButtonElement>('[data-admin-page-header] button')?.focus({ preventScroll: true });
    };
  }, [open]);
  if (!open) return null;
  return <div className="fixed inset-0 z-[90] grid place-items-center bg-black/30 p-4" onMouseDown={event => { if (event.target === event.currentTarget && !pending) onClose(); }}>
    <section ref={panel} role="alertdialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} aria-busy={pending} className="admin-theme w-full max-w-sm rounded-2xl bg-white p-5">
      <Trash2 size={24} className="text-danger" aria-hidden="true" />
      <h2 id={`${id}-title`} className="m-0 mt-4 text-xl font-semibold">{title}</h2>
      <p id={`${id}-description`} className="m-0 mt-2 break-words text-base leading-6 text-muted">{description}</p>
      {children}
      {error ? <AdminNotice className="mt-4">Não foi possível excluir. Tente novamente.</AdminNotice> : null}
      <div className="mt-6 flex justify-end gap-2">
        <button ref={cancel} type="button" disabled={pending} onClick={onClose} className={buttonClasses.secondary.md}>Cancelar</button>
        <button type="button" disabled={pending} onClick={onConfirm} className={buttonClasses.danger.md}>{pending ? <LoaderCircle size={17} className="animate-spin motion-reduce:animate-none" /> : null}{pending ? 'Excluindo...' : 'Excluir'}</button>
      </div>
    </section>
  </div>;
}
