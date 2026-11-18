import { Clock3, MapPin, Repeat2 } from "lucide-react";
import type { CalendarEvent } from "../../../../shared/api/events";
import { AdminConfirmDialog } from "../../../admin/AdminConfirmDialog";

export function DeleteEventDialog({ event, pending, error = false, onCancel, onConfirm }: { event: CalendarEvent | null; pending: boolean; error?: boolean; onCancel: () => void; onConfirm: () => void }) {
  return <AdminConfirmDialog open={Boolean(event)} title="Excluir evento?" description={event?.repeat === "none" ? "O evento será removido da agenda. Esta ação não poderá ser desfeita." : "Todas as ocorrências desta série serão excluídas. Esta ação não poderá ser desfeita."} pending={pending} error={error ? new Error("Não foi possível excluir") : null} onClose={onCancel} onConfirm={onConfirm}>
    {event ? <div className="mt-4 border-y border-line py-4">
      <strong className="block break-words text-base">{event.title}</strong>
      <p className="m-0 mt-2 flex items-start gap-2 text-sm leading-6 text-muted"><Clock3 size={16} className="mt-1 shrink-0" aria-hidden="true" />{new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(event.start))}</p>
      <p className="m-0 mt-1 flex items-start gap-2 text-sm leading-6 text-muted"><MapPin size={16} className="mt-1 shrink-0" aria-hidden="true" />{event.location || "Local a definir"}</p>
      {event.repeat !== "none" ? <p className="m-0 mt-2 flex items-center gap-2 text-sm font-semibold text-danger"><Repeat2 size={16} aria-hidden="true" />Série {event.repeat === "weekly" ? "semanal" : "mensal"}</p> : null}
    </div> : null}
  </AdminConfirmDialog>;
}
