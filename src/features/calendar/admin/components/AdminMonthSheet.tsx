import { CalendarDays, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { CalendarEvent } from '../../../../shared/api/events';
import { isSameDay } from '../../calendar.utils';
import { Agenda } from '../../components/Agenda';

type AdminMonthSheetProps = {
  open: boolean;
  events: CalendarEvent[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onToday: () => void;
  onClose: () => void;
};

export function AdminMonthSheet({
  open,
  events,
  selectedDate,
  onSelectDate,
  onToday,
  onClose,
}: AdminMonthSheetProps) {
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end bg-slate-950/35 lg:hidden"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-month-sheet-title"
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white pb-[calc(1rem+env(safe-area-inset-bottom,0px))] shadow-2xl"
      >
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-slate-200" />
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="min-w-0">
            <p className="m-0 flex items-center gap-1.5 text-[0.6rem] font-extrabold uppercase tracking-[0.14em] text-amber-700">
              <CalendarDays size={14} /> Escolha uma data
            </p>
            <h2 id="admin-month-sheet-title" className="m-0 mt-1 text-lg font-bold tracking-[-0.02em] text-slate-950">
              Calendário mensal
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar calendário mensal"
            className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-slate-100 text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
          >
            <X size={18} />
          </button>
        </div>

        <Agenda
          events={events}
          selectedDate={selectedDate}
          view="month"
          onSelectDate={(date) => {
            onSelectDate(date);
            onClose();
          }}
          onNavigateDate={onSelectDate}
          onToday={onToday}
          isToday={isSameDay(selectedDate, new Date())}
          selectionTone="amber"
          plain
        />
      </section>
    </div>
  );
}
