import { MoreHorizontal, type LucideIcon } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type AdminMenuAction = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
};

/** A portalled menu stays visible inside clipped lists and above fixed navigation. */
export function AdminActionMenu({ label, actions, disabled = false, quiet = false }: { label: string; actions: AdminMenuAction[]; disabled?: boolean; quiet?: boolean }) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const focusLast = useRef(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const isOpen = position !== null;
  const close = (restoreFocus = true) => { setPosition(null); if (restoreFocus) trigger.current?.focus({ preventScroll: true }); };
  useLayoutEffect(() => {
    if (!position || !menu.current) return;
    const rect = menu.current.getBoundingClientRect();
    if (rect.bottom > window.innerHeight - 8 && position.top > 8) {
      setPosition({ ...position, top: Math.max(8, position.top - (rect.bottom - window.innerHeight + 8)) });
    }
  }, [position]);

  useEffect(() => {
    if (!isOpen) return;
    const items = () => Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? []);
    const buttons = items();
    (focusLast.current ? buttons.at(-1) : buttons[0])?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) setPosition(null);
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setPosition(null); trigger.current?.focus({ preventScroll: true }); }
      if (event.key === 'Tab') { setPosition(null); trigger.current?.focus({ preventScroll: true }); }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const buttons = items();
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next]?.focus({ preventScroll: true });
    };
    const dismiss = (event: Event) => { if (!(event.target instanceof Node) || !menu.current?.contains(event.target)) setPosition(null); };
    const reposition = (event: Event) => {
      if (event.target instanceof Node && menu.current?.contains(event.target)) return;
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) { setPosition(null); return; }
      const height = menu.current?.getBoundingClientRect().height ?? 0;
      const next = { left: Math.max(8, Math.min(rect.right - 224, window.innerWidth - 232)), top: Math.max(8, rect.bottom + height + 8 > window.innerHeight ? rect.top - height - 4 : rect.bottom + 4) };
      setPosition(current => current?.top === next.top && current.left === next.left ? current : next);
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', keydown);
    window.addEventListener('resize', dismiss);
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', keydown);
      window.removeEventListener('resize', dismiss);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [isOpen]);

  function open(last = false) {
    focusLast.current = last;
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const height = actions.length * 48 + 16;
    setPosition({ left: Math.max(8, Math.min(rect.right - 224, window.innerWidth - 232)), top: Math.max(8, rect.bottom + height + 8 > window.innerHeight ? rect.top - height - 4 : rect.bottom + 4) });
  }

  return <>
    <button ref={trigger} type="button" aria-label={`Mais ações: ${label}`} title="Mais ações" aria-haspopup="menu" aria-expanded={Boolean(position)} aria-controls={position ? id : undefined} disabled={disabled} onClick={() => position ? close() : open()} onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); open(event.key === 'ArrowUp'); } }} className={`inline-flex h-11 min-w-11 flex-none items-center justify-center rounded-lg ${quiet ? '' : 'border border-line bg-white'} px-3 text-muted hover:bg-selection/35`}><MoreHorizontal size={20} aria-hidden="true" /></button>
    {position && createPortal(<div ref={menu} id={id} role="menu" aria-label={`Ações: ${label}`} className="admin-theme fixed z-[100] max-h-[calc(100dvh-1rem)] w-56 overflow-y-auto rounded-xl border border-line bg-white p-2 shadow-lg" style={position}>
      {actions.map(({ label: actionLabel, icon: Icon, onClick, disabled: actionDisabled, danger }) => <button key={actionLabel} type="button" role="menuitem" disabled={actionDisabled} onClick={() => { close(); onClick(); }} className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium disabled:opacity-50 ${danger ? 'text-danger hover:bg-danger/10' : 'text-ink hover:bg-selection/35'}`}><Icon size={18} className="flex-none" aria-hidden="true" /><span className="min-w-0 break-words">{actionLabel}</span></button>)}
    </div>, document.body)}
  </>;
}
