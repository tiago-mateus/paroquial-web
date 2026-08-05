import { CalendarDays, Clock, MapPin, Repeat2, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { CalendarEvent, EventType } from "../../shared/api/events";

const typeLabels: Record<EventType, string> = {
  missa: "Missa",
  novena: "Novena",
  reuniao: "Reunião",
  encontro: "Encontro",
  adoracao: "Adoração",
  movimento: "Movimento",
  outro: "Evento",
};

export function AgendaEventDetails({ event, onClose }: { event: CalendarEvent | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!event) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "Escape") onClose();
      if (keyboardEvent.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (keyboardEvent.shiftKey && document.activeElement === first) {
        keyboardEvent.preventDefault();
        last.focus();
      } else if (!keyboardEvent.shiftKey && document.activeElement === last) {
        keyboardEvent.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [event, onClose]);

  if (!event) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-details-title"
        className="max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl sm:rounded-[2rem]"
        onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
      >
        <header className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 pb-4 pt-6 backdrop-blur-xl sm:py-4">
          <span aria-hidden="true" className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-slate-200 sm:hidden" />
          <div>
            <p className="m-0 text-[0.65rem] font-extrabold uppercase tracking-[0.15em] text-amber-700">{typeLabels[event.type]}</p>
            <h2 id="event-details-title" className="mb-0 mt-1 text-xl font-bold leading-tight text-slate-950">{event.title}</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Fechar detalhes" className="grid h-10 w-10 flex-none place-items-center rounded-full bg-slate-100 p-0 text-slate-600 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40">
            <X size={18} />
          </button>
        </header>

        <div className="grid gap-4 px-5 py-5 text-sm text-slate-600">
          <Detail icon={<CalendarDays size={17} />} label={formatDate(event.start)} />
          <Detail icon={<Clock size={17} />} label={formatTimeRange(event)} />
          <Detail icon={<MapPin size={17} />} label={event.location?.trim() || "Local a confirmar"} />
          {event.repeat !== "none" ? <Detail icon={<Repeat2 size={17} />} label={formatRepeat(event)} /> : null}
          {event.description?.trim() ? (
            <div className="mt-1 rounded-2xl bg-stone-50 p-4">
              <h3 className="m-0 text-sm font-bold text-slate-950">Sobre o evento</h3>
              <p className="mb-0 mt-2 leading-6 text-slate-600">{event.description}</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Detail({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-800">{icon}</span><span className="font-medium leading-5">{label}</span></div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
}

function formatTimeRange(event: CalendarEvent) {
  const start = formatTime(event.start);
  return event.end ? `${start} às ${formatTime(event.end)}` : start;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatRepeat(event: CalendarEvent) {
  if (event.repeat === "weekly") return "Evento semanal";
  if (event.repeat === "monthly") return "Evento mensal";
  return "Evento recorrente";
}
