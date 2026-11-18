import { CalendarDays, Clock } from "lucide-react";
import { useState } from "react";
import type { ConfessionScheduleItem } from "../../shared/api/tenants";
import { PublicDialog } from "../../shared/components/PublicDialog";
import { EmptyState } from "../../shared/components/PageState";

type HeaderAction = { label: string; subtitle: string; href?: string };

export function ConfessionAction({ action, schedule, preview = false, appearance = "cover" }: {
  action: HeaderAction;
  schedule?: ConfessionScheduleItem[] | null;
  preview?: boolean;
  appearance?: "cover" | "light";
}) {
  const [open, setOpen] = useState(false);
  const items = (schedule ?? []).map((item) => ({
    dayLabel: item.dayLabel?.trim() ?? "", startTime: item.startTime?.trim() ?? "", endTime: item.endTime?.trim() ?? "",
  })).filter((item) => item.dayLabel && item.startTime && item.endTime);

  return <>
    <button type="button" onClick={() => setOpen(true)} className={`grid min-h-[76px] min-w-0 grid-cols-[1.125rem_minmax(0,1fr)] content-center items-center gap-x-2 gap-y-1 rounded-xl border px-3 py-3 text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:-outline-offset-4 ${appearance === "light" ? "border-transparent bg-surface text-ink hover:bg-selection focus-visible:outline-focus" : "border-white/20 bg-black/10 text-white backdrop-blur-[10px] hover:bg-white/10 focus-visible:outline-surface"} ${preview ? "" : "sm:px-4"}`}>
      <span className={`inline-flex items-center justify-center ${appearance === "light" ? "text-primary" : "text-white"}`}><CalendarDays size={18} aria-hidden="true" /></span>
      <span className="contents"><span className="min-w-0 break-words text-sm font-bold leading-5">{action.label}</span><small className={`col-span-2 text-[13px] font-medium leading-5 ${appearance === "light" ? "text-muted" : "text-white"}`}>{action.subtitle}</small></span>
    </button>
    <PublicDialog open={open} onClose={() => setOpen(false)} title="Horários de confissões" description="Consulte os dias e horários disponíveis." variant="center">
      <div className="grid gap-3 px-5 py-4">
        {items.length ? items.map((item, index) => <div className="flex items-center gap-3 rounded-2xl border border-line bg-canvas px-3 py-3" key={`${item.dayLabel}-${item.startTime}-${index}`}>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-ink"><Clock size={16} aria-hidden="true" /></span>
          <span><strong className="block text-ink">{item.dayLabel}</strong><small className="mt-0.5 block text-muted">{item.startTime} às {item.endTime}</small></span>
        </div>) : <EmptyState icon={<CalendarDays size={24} />} title="Nenhum horário publicado" description="Entre em contato com a secretaria para consultar a disponibilidade de confissões." className="border-0 px-0" />}
      </div>
    </PublicDialog>
  </>;
}
