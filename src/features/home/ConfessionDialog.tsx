import { CalendarDays, Clock, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ConfessionScheduleItem } from "../../shared/api/tenants";

type HeaderAction = {
  label: string;
  subtitle: string;
  href?: string;
};

export function ConfessionAction({
  action,
  schedule,
  preview = false,
}: {
  action: HeaderAction;
  schedule?: ConfessionScheduleItem[] | null;
  preview?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={`flex min-w-0 items-center gap-2 rounded-xl border border-white/20 bg-black/10 px-3 py-2.5 text-left text-white backdrop-blur-[10px] transition hover:bg-white/10 ${preview ? "" : "md:px-4 md:py-3"}`}
      >
        <span className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-white/15">
          <CalendarDays size={15} />
        </span>
        <span className="grid min-w-0">
          <span className="text-xs font-extrabold leading-[1.1]">{action.label}</span>
          <small className="truncate text-[0.64rem] text-inherit opacity-70">{action.subtitle}</small>
        </span>
      </button>
      <ConfessionDialog open={open} onClose={close} schedule={schedule} />
    </>
  );
}

function ConfessionDialog({
  open,
  onClose,
  schedule,
}: {
  open: boolean;
  onClose: () => void;
  schedule?: ConfessionScheduleItem[] | null;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    closeButtonRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const items = normalizeSchedule(schedule);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-md" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confession-dialog-title"
        className="max-h-[80dvh] w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="confession-dialog-title" className="m-0 text-base font-bold text-slate-950">
              Horários de confissões
            </h2>
            <p className="mb-0 mt-1 text-sm text-slate-500">Consulte os dias e horários disponíveis.</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-transparent p-0 text-slate-500"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={17} />
          </button>
        </div>

        <div className="grid gap-3 overflow-y-auto px-5 py-4">
          {items.length ? items.map((item, index) => (
            <div
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
              key={`${item.dayLabel}-${item.startTime}-${index}`}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Clock size={16} />
              </span>
              <span>
                <strong className="block text-slate-950">{item.dayLabel}</strong>
                <small className="mt-0.5 block text-slate-500">
                  {item.startTime} às {item.endTime}
                </small>
              </span>
            </div>
          )) : <div className="py-5 text-center"><CalendarDays size={24} className="mx-auto text-slate-300" /><p className="m-0 mt-3 text-sm font-bold text-slate-800">Nenhum horário publicado</p><p className="mx-auto mb-0 mt-1 max-w-xs text-xs leading-5 text-slate-500">Entre em contato com a secretaria para consultar a disponibilidade de confissões.</p></div>}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function normalizeSchedule(schedule?: ConfessionScheduleItem[] | null) {
  const normalized = (schedule ?? [])
    .map((item) => ({
      dayLabel: item.dayLabel?.trim() ?? "",
      startTime: item.startTime?.trim() ?? "",
      endTime: item.endTime?.trim() ?? "",
    }))
    .filter((item) => item.dayLabel && item.startTime && item.endTime);

  return normalized;
}
