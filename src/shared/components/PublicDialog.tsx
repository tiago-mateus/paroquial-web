import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { classNames } from "../lib/classNames";
import { IconButton } from "./IconButton";

type Props = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  closeLabel?: string;
  variant?: "sheet" | "center";
  children: ReactNode;
};

export function PublicDialog({ open, onClose, title, description, closeLabel = "Fechar", variant = "sheet", children }: Props) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onCloseRef.current(); return; }
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])
        .filter((element) => !element.closest("[hidden], [inert]") && element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first) { event.preventDefault(); dialogRef.current?.focus(); }
      else if (!dialogRef.current?.contains(document.activeElement) || (!event.shiftKey && document.activeElement === last)) { event.preventDefault(); first.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);
  if (!open) return null;

  const sheet = variant === "sheet";
  return createPortal(<div className={classNames("fixed inset-0 z-[70] flex justify-center bg-ink/45", sheet ? "items-end p-0 sm:items-center sm:p-4" : "items-center p-4")} onPointerDown={(event) => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} tabIndex={-1} className={classNames("flex w-full flex-col overflow-hidden bg-surface shadow-[0_24px_80px_rgb(22_59_49/0.2)]", sheet ? "max-h-[88dvh] max-w-lg rounded-t-2xl sm:rounded-2xl" : "max-h-[80dvh] max-w-md rounded-2xl")}>
      <header className={classNames("relative flex shrink-0 items-start justify-between gap-4 border-b border-line bg-surface px-5", sheet ? "pb-4 pt-6 sm:py-4" : "py-4")}>
        {sheet ? <span aria-hidden="true" className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-line sm:hidden" /> : null}
        <div className="min-w-0">
          <h2 id={titleId} className={classNames("m-0 font-display font-medium leading-tight", sheet ? "text-xl text-primary" : "text-2xl text-ink")}>{title}</h2>
          {description ? <p id={descriptionId} className={classNames("mb-0 text-sm text-muted", sheet ? "mt-2" : "mt-1")}>{description}</p> : null}
        </div>
        <IconButton ref={closeRef} onClick={onClose} label={closeLabel} icon={X} className={sheet ? "bg-canvas" : undefined} />
      </header>
      <div className="min-h-0 overflow-y-auto overscroll-contain">{children}</div>
    </section>
  </div>, document.querySelector(".public-home-theme") ?? document.body);
}
