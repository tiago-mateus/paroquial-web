import { useCallback, useContext, useEffect, useRef } from "react";
import { UNSAFE_DataRouterContext, useBeforeUnload, useBlocker } from "react-router-dom";
import { buttonClasses } from "../../shared/styles/controls";

export function UnsavedChanges({ dirty }: { dirty: boolean }) {
  const router = useContext(UNSAFE_DataRouterContext);
  useBeforeUnload(useCallback((event: BeforeUnloadEvent) => {
    if (dirty) { event.preventDefault(); event.returnValue = ""; }
  }, [dirty]));
  return router ? <NavigationGuard dirty={dirty} /> : null;
}
function NavigationGuard({ dirty }: { dirty: boolean }) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search));
  if (blocker.state !== "blocked") return null;
  return <DiscardChangesDialog onStay={() => blocker.reset()} onLeave={() => blocker.proceed()} />;
}
export function DiscardChangesDialog({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; const overflow = document.body.style.overflow; document.body.style.overflow = "hidden"; ref.current?.focus(); return () => { document.body.style.overflow = overflow; previous?.focus(); }; }, []);
  return <div className="fixed inset-0 z-[110] grid place-items-center bg-black/30 p-4"><section role="alertdialog" aria-modal="true" aria-labelledby="unsaved-title" aria-describedby="unsaved-description" className="w-full max-w-sm rounded-2xl bg-white p-5" onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); onStay(); } if (event.key === "Tab") { event.preventDefault(); const buttons = event.currentTarget.querySelectorAll('button'); const next = document.activeElement === buttons[0] ? buttons[1] : buttons[0]; next?.focus(); } }}><h2 id="unsaved-title" className="m-0 text-lg font-bold">Descartar alterações?</h2><p id="unsaved-description" className="my-3 text-sm text-muted">Existem alterações não salvas. Continue editando para salvá-las antes de sair.</p><div className="flex flex-wrap justify-end gap-2"><button ref={ref} type="button" onClick={onStay} className={buttonClasses.secondary.md}>Continuar editando</button><button type="button" onClick={onLeave} className={buttonClasses.danger.md}>Descartar e sair</button></div></section></div>;
}
