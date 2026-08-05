import { CalendarClock, ChevronDown, Clock3, Info, MapPin, Repeat2, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { PublicChurch } from "../../shared/api/churches";
import type { CalendarEvent, CreateEventRequest, EventType, RepeatOption } from "../../shared/api/events";
import { classNames } from "../../shared/lib/classNames";

type Values = { title: string; description: string; location: string; locationChoice: string; date: string; startTime: string; endTime: string; type: EventType; repeat: RepeatOption; repeatUntil: string };
export type EventEditor = { kind: "create"; date: Date; source?: CalendarEvent } | { kind: "edit"; event: CalendarEvent };

const typeOptions: Array<[EventType, string]> = [["missa", "Missa"], ["novena", "Novena"], ["reuniao", "Reunião"], ["encontro", "Encontro"], ["adoracao", "Adoração"], ["movimento", "Movimento"], ["outro", "Outro"]];

function dateValue(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function timeValue(value?: string) { return value ? value.slice(11, 16) : ""; }
function defaults(editor: EventEditor, churches: PublicChurch[]): Values {
  const event = editor.kind === "edit" ? editor.event : editor.source;
  const location = event?.location ?? "";
  const registeredLocation = churches.find((church) => normalize(church.nome) === normalize(location))?.nome;
  return {
    title: event?.title ?? "",
    description: event?.description ?? "",
    location,
    locationChoice: registeredLocation ?? (location ? "__other" : ""),
    date: editor.kind === "edit" ? editor.event.start.slice(0, 10) : dateValue(editor.date),
    startTime: timeValue(event?.start) || "18:00",
    endTime: timeValue(event?.end) || "19:00",
    type: event?.type ?? "missa",
    repeat: editor.kind === "edit" ? editor.event.repeat : "none",
    repeatUntil: editor.kind === "edit" ? editor.event.repeatUntil?.slice(0, 10) ?? "" : "",
  };
}

export function AdminEventFormDialog({ editor, churches, pending, error, onClose, onSubmit, onDelete }: { editor: EventEditor | null; churches: PublicChurch[]; pending: boolean; error?: string; onClose: () => void; onSubmit: (input: CreateEventRequest) => Promise<void>; onDelete: () => void }) {
  const panelRef = useRef<HTMLElement>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<Values>();
  const values = watch();
  const repeat = values.repeat;
  const locationChoice = values.locationChoice;

  useEffect(() => {
    if (!editor) return;
    const initial = defaults(editor, churches);
    reset(initial);
    setDetailsOpen(Boolean(initial.description));
  }, [churches, editor, reset]);
  useEffect(() => {
    if (!editor) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>("input")?.focus(), 0);
    const listener = (event: KeyboardEvent) => { if (event.key === "Escape" && !pending) onClose(); };
    document.addEventListener("keydown", listener);
    return () => { window.clearTimeout(timer); document.removeEventListener("keydown", listener); document.body.style.overflow = overflow; previous?.focus(); };
  }, [editor, onClose, pending]);
  if (!editor) return null;

  const submit = handleSubmit(async (formValues) => {
    const selectedDate = new Date(`${formValues.date}T12:00:00`);
    const location = formValues.locationChoice === "__other" ? formValues.location.trim() : formValues.locationChoice.trim();
    await onSubmit({
      title: formValues.title.trim(),
      description: formValues.description.trim() || undefined,
      location: location || undefined,
      start: `${formValues.date}T${formValues.startTime}:00`,
      end: formValues.endTime ? `${formValues.date}T${formValues.endTime}:00` : undefined,
      type: formValues.type,
      repeat: formValues.repeat,
      repeatUntil: formValues.repeat !== "none" && formValues.repeatUntil ? formValues.repeatUntil : undefined,
      repeatWeekdays: formValues.repeat === "weekly" ? [selectedDate.getDay()] : undefined,
      repeatMonthDay: formValues.repeat === "monthly" ? selectedDate.getDate() : undefined,
    });
  });
  const fieldClass = "mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-amber-400 focus:ring-3 focus:ring-amber-100";
  const labelClass = "text-xs font-bold text-slate-700";
  const isDuplicate = editor.kind === "create" && Boolean(editor.source);

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/35 backdrop-blur-[1px]" onMouseDown={(event) => event.target === event.currentTarget && !pending && onClose()}>
      <section ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="event-form-title" className="flex h-full w-full flex-col bg-stone-50 shadow-2xl sm:max-w-[38rem]">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 flex-none place-items-center rounded-2xl bg-amber-100 text-amber-800"><CalendarClock size={19} /></span><div className="min-w-0"><p className="m-0 truncate text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-amber-700">{formatDateLabel(values.date)}</p><h2 id="event-form-title" className="m-0 text-lg font-bold">{editor.kind === "edit" ? "Editar evento" : isDuplicate ? "Duplicar evento" : "Novo evento"}</h2></div></div>
          <button type="button" aria-label="Fechar formulário" onClick={onClose} disabled={pending} className="grid h-10 w-10 flex-none place-items-center rounded-full bg-slate-100 p-0 text-slate-600 hover:bg-slate-200"><X size={18} /></button>
        </header>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid flex-1 content-start gap-4 overflow-y-auto px-4 py-5 sm:px-6">
            <FormSection title="Informações principais" icon={<Info size={15} />}>
              <label className={labelClass}>Título<input {...register("title", { required: "Informe o título do evento.", validate: (value) => value.trim().length >= 3 || "Use pelo menos 3 caracteres." })} className={`${fieldClass} text-base font-semibold`} placeholder="Ex.: Santa Missa" />{errors.title ? <FieldError>{errors.title.message}</FieldError> : null}</label>
              <fieldset><legend className={labelClass}>Tipo</legend><div className="mt-2 flex flex-wrap gap-2">{typeOptions.map(([value, label]) => <label key={value} className={classNames("cursor-pointer rounded-full border px-3 py-2 text-xs font-bold transition", values.type === value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}><input type="radio" value={value} {...register("type")} className="sr-only" />{label}</label>)}</div></fieldset>
            </FormSection>

            <FormSection title="Data e horário" icon={<Clock3 size={15} />}>
              <div className="grid gap-3 sm:grid-cols-[1.25fr_1fr_1fr]">
                <label className={labelClass}>Data<input type="date" {...register("date", { required: "Informe a data." })} className={fieldClass} /></label>
                <label className={labelClass}>Início<input type="time" {...register("startTime", { required: "Informe o início." })} className={fieldClass} /></label>
                <label className={labelClass}>Término <span className="font-medium text-slate-400">(opcional)</span><input type="time" {...register("endTime", { validate: (value) => !value || !values.startTime || value > values.startTime || "Deve ser após o início." })} className={fieldClass} />{errors.endTime ? <FieldError>{errors.endTime.message}</FieldError> : null}</label>
              </div>
            </FormSection>

            <FormSection title="Local" icon={<MapPin size={15} />}>
              <label className={labelClass}>Igreja ou espaço
                <span className="relative block"><select {...register("locationChoice")} className={`${fieldClass} appearance-none pr-10`}><option value="">Local a definir</option>{churches.map((church) => <option key={church.id} value={church.nome}>{church.nome}</option>)}<option value="__other">Outro local...</option></select><ChevronDown size={15} className="pointer-events-none absolute bottom-3.5 right-3 text-slate-400" /></span>
              </label>
              {locationChoice === "__other" ? <label className={labelClass}>Nome do local<input {...register("location", { validate: (value) => locationChoice !== "__other" || value.trim() ? true : "Informe o local." })} className={fieldClass} placeholder="Ex.: Salão paroquial" />{errors.location ? <FieldError>{errors.location.message}</FieldError> : null}</label> : null}
              {churches.length ? <p className="m-0 text-[0.68rem] leading-5 text-slate-400">Selecionar uma igreja cadastrada mantém o evento conectado ao mapa público.</p> : null}
            </FormSection>

            <FormSection title="Repetição" icon={<Repeat2 size={15} />}>
              <div className="grid grid-cols-3 gap-2" role="group" aria-label="Repetição do evento">{([['none', 'Não repetir'], ['weekly', 'Semanal'], ['monthly', 'Mensal']] as const).map(([value, label]) => <label key={value} className={classNames("cursor-pointer rounded-xl border px-2 py-2.5 text-center text-xs font-bold transition", repeat === value ? "border-amber-300 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-600")}><input type="radio" value={value} {...register("repeat")} className="sr-only" />{label}</label>)}</div>
              {repeat !== "none" ? <label className={labelClass}>Repetir até<input type="date" {...register("repeatUntil", { validate: (value) => (Boolean(value) && value >= values.date) || "Escolha uma data igual ou posterior ao evento." })} className={fieldClass} />{errors.repeatUntil ? <FieldError>{errors.repeatUntil.message}</FieldError> : null}</label> : null}
            </FormSection>

            <div className="rounded-2xl border border-slate-200 bg-white">
              <button type="button" onClick={() => setDetailsOpen((open) => !open)} aria-expanded={detailsOpen} className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left text-sm font-bold text-slate-700"><span>{detailsOpen ? "Descrição" : "+ Adicionar descrição"}</span><ChevronDown size={16} className={`transition ${detailsOpen ? "rotate-180" : ""}`} /></button>
              {detailsOpen ? <div className="border-t border-slate-100 p-4"><textarea {...register("description")} rows={3} className={`${fieldClass} mt-0 resize-none`} placeholder="Orientações e informações úteis" /></div> : null}
            </div>

            <div className="rounded-2xl bg-slate-950 px-4 py-3 text-white"><p className="m-0 text-[0.6rem] font-extrabold uppercase tracking-[0.12em] text-amber-300">Resumo</p><strong className="mt-1 block truncate text-sm">{values.title?.trim() || "Título do evento"}</strong><p className="mb-0 mt-1 text-xs text-slate-300">{formatPreview(values)}</p></div>
            {error ? <p role="alert" className="m-0 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
            {editor.kind === "edit" ? <button type="button" onClick={onDelete} disabled={pending} className="inline-flex h-11 justify-self-start items-center gap-2 rounded-xl px-3 text-sm font-bold text-red-600 hover:bg-red-50"><Trash2 size={16} /> Excluir evento</button> : null}
          </div>

          <footer className="flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
            <button type="button" onClick={onClose} disabled={pending} className="h-11 rounded-xl px-4 text-sm font-bold text-slate-500 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={pending} className="h-11 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60">{pending ? "Salvando..." : editor.kind === "edit" ? "Salvar alterações" : isDuplicate ? "Criar cópia" : "Criar evento"}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function FormSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) { return <section className="grid gap-4 rounded-2xl border border-slate-200/80 bg-white p-4"><h3 className="m-0 flex items-center gap-2 text-sm font-bold text-slate-950"><span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-50 text-amber-800">{icon}</span>{title}</h3>{children}</section>; }
function FieldError({ children }: { children: React.ReactNode }) { return <span className="mt-1 block text-xs font-medium text-red-600">{children}</span>; }
function normalize(value = "") { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim(); }
function formatDateLabel(value?: string) { if (!value) return "Agenda administrativa"; const date = new Date(`${value}T12:00:00`); return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(date); }
function formatPreview(values: Partial<Values>) { const date = values.date ? formatDateLabel(values.date) : "Data a definir"; const time = values.startTime ? `${values.startTime}${values.endTime ? `–${values.endTime}` : ""}` : "Horário a definir"; const location = values.locationChoice === "__other" ? values.location : values.locationChoice; return `${date} · ${time}${location ? ` · ${location}` : ""}`; }
