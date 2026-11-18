import { CalendarDays, Clock, MapPin, Repeat2 } from "lucide-react";
import type { CalendarEvent, EventType } from "../../shared/api/events";
import { DirectionsLink } from "../../shared/components/DirectionsLink";
import { PublicDialog } from "../../shared/components/PublicDialog";
import { formatEventTimeRange } from "../events/event.utils";

const typeLabels: Record<EventType, string> = {
  missa: "Missa", novena: "Novena", reuniao: "Reunião", encontro: "Encontro",
  adoracao: "Adoração", movimento: "Movimento", outro: "Evento",
};

export function AgendaEventDetails({ event, onClose, locationContext }: { event: CalendarEvent | null; onClose: () => void; locationContext?: string }) {
  if (!event) return null;
  const location = event.location?.trim();
  const directionsHref = location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([location, locationContext].filter(Boolean).join(", "))}` : null;

  return <PublicDialog open onClose={onClose} title={event.title} description={typeLabels[event.type]} closeLabel="Fechar detalhes">
    <div className="grid gap-4 px-5 py-5 text-base text-muted">
      <Detail icon={<CalendarDays size={17} />} label={formatDate(event.start)} />
      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3 rounded-xl bg-selection p-3">
        <span className="grid h-10 w-10 place-items-center text-primary"><Clock size={21} aria-hidden="true" /></span>
        <div><p className="m-0 text-[13px] text-primary">Horário</p><p className="mb-0 mt-1 text-xl font-extrabold leading-7 tabular-nums text-primary">{formatEventTimeRange(event, " às ")}</p></div>
      </div>
      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/40 text-accent-ink"><MapPin size={19} aria-hidden="true" /></span>
        <div className="min-w-0"><p className="m-0 text-[13px] text-muted">Local</p><p className="mb-0 mt-1 font-semibold leading-6 text-ink">{location || "Local a confirmar"}</p>
          <DirectionsLink href={directionsHref} destination={location} variant="text" trailingIcon className="mt-2" />
        </div>
      </div>
      {event.repeat !== "none" ? <Detail icon={<Repeat2 size={17} />} label={formatRepeat(event)} /> : null}
      {event.description?.trim() ? <div className="mt-1 rounded-2xl bg-canvas p-4">
        <h3 className="m-0 text-sm font-bold text-ink">Sobre o evento</h3>
        <p className="mb-0 mt-2 leading-6 text-muted">{event.description}</p>
      </div> : null}
    </div>
  </PublicDialog>;
}

function Detail({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/40 text-accent-ink">{icon}</span><span className="font-medium leading-6">{label}</span></div>;
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
}
function formatRepeat(event: CalendarEvent) {
  if (event.repeat === "weekly") return "Evento semanal";
  if (event.repeat === "monthly") return "Evento mensal";
  return "Evento recorrente";
}
