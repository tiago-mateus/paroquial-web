import { AlertTriangle, CalendarClock, Check, ChevronDown, ChevronRight, Clock3, Info, LoaderCircle, MapPin, Repeat2, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { PublicChurch } from "../../../../shared/api/churches";
import type { CalendarEvent, CreateEventRequest, EventType, RepeatOption } from "../../../../shared/api/events";
import { classNames } from "../../../../shared/lib/classNames";
import { fieldClassName, fieldErrorClassName, labelClassName } from "../../../admin/AdminFormStyles";
import { buttonClasses, fieldClasses } from "../../../../shared/styles/controls";
import { AdminNotice } from "../../../admin/AdminNotice";
import { DiscardChangesDialog, UnsavedChanges } from "../../../admin/UnsavedChanges";

type Values = {
  title: string;
  description: string;
  location: string;
  locationChoice: string;
  date: string;
  startTime: string;
  endTime: string;
  type: EventType;
  repeat: RepeatOption;
  repeatUntil: string;
  repeatWeekdays: number[];
};

export type EventEditor =
  | { kind: "create"; date: Date; source?: CalendarEvent }
  | { kind: "edit"; event: CalendarEvent };

/** Erro devolvido pela API (ApiError) já normalizado para o formulário. */
export type EventFormError = { message: string; fields?: Record<string, string[]> };

export type ChurchesStatus = "loading" | "error" | "ready";

const typeOptions: Array<[EventType, string]> = [
  ["missa", "Missa"],
  ["novena", "Novena"],
  ["reuniao", "Reunião"],
  ["encontro", "Encontro"],
  ["adoracao", "Adoração"],
  ["movimento", "Movimento"],
  ["outro", "Outro"],
];

// Ordem de exibição começando na segunda, como o restante da agenda administrativa.
const weekdayOptions: Array<{ value: number; short: string; long: string; plural: string }> = [
  { value: 1, short: "Seg", long: "segunda-feira", plural: "segundas" },
  { value: 2, short: "Ter", long: "terça-feira", plural: "terças" },
  { value: 3, short: "Qua", long: "quarta-feira", plural: "quartas" },
  { value: 4, short: "Qui", long: "quinta-feira", plural: "quintas" },
  { value: 5, short: "Sex", long: "sexta-feira", plural: "sextas" },
  { value: 6, short: "Sáb", long: "sábado", plural: "sábados" },
  { value: 0, short: "Dom", long: "domingo", plural: "domingos" },
];

/** Campos da API mapeados para os campos do formulário. */
const serverFieldMap: Record<string, keyof Values> = {
  title: "title",
  start: "startTime",
  end: "endTime",
  location: "location",
  description: "description",
  repeatUntil: "repeatUntil",
};

function dateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function timeValue(value?: string) {
  return value ? value.slice(11, 16) : "";
}
function weekdayOf(date: string) {
  return new Date(`${date}T12:00:00`).getDay();
}
function defaults(editor: EventEditor, churches: PublicChurch[]): Values {
  const event = editor.kind === "edit" ? editor.event : editor.source;
  const location = event?.location ?? "";
  const registeredLocation = churches.find(
    (church) => normalize(church.nome) === normalize(location),
  )?.nome;
  const date = editor.kind === "edit" ? editor.event.start.slice(0, 10) : dateValue(editor.date);
  const repeat = editor.kind === "edit" ? editor.event.repeat : "none";
  return {
    title: event?.title ?? "",
    description: event?.description ?? "",
    location,
    locationChoice: registeredLocation ?? (location ? "__other" : ""),
    date,
    startTime: timeValue(event?.start) || "18:00",
    endTime: event ? timeValue(event.end) : "19:00",
    type: event?.type ?? "missa",
    repeat,
    repeatUntil:
      editor.kind === "edit" ? (editor.event.repeatUntil?.slice(0, 10) ?? "") : "",
    repeatWeekdays:
      repeat === "weekly" && editor.kind === "edit" && editor.event.repeatWeekdays.length
        ? [...editor.event.repeatWeekdays]
        : [weekdayOf(date)],
  };
}

export function AdminEventFormDialog({
  editor,
  churches,
  churchesStatus = "ready",
  pending,
  error,
  onClose,
  onSubmit,
  onDelete,
}: {
  editor: EventEditor | null;
  churches: PublicChurch[];
  churchesStatus?: ChurchesStatus;
  pending: boolean;
  error?: EventFormError;
  onClose: () => void;
  onSubmit: (input: CreateEventRequest) => Promise<void>;
  onDelete: () => void;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const requestCloseRef = useRef<() => void>(() => undefined);
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const lastEditorRef = useRef<EventEditor | null>(null);
  const previousStartRef = useRef("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    setError,
    setFocus,
    getValues,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<Values>();
  const values = watch();
  const repeat = values.repeat;
  const locationChoice = values.locationChoice;
  requestCloseRef.current = () => {
    if (pendingRef.current) return;
    if (isDirty) setDiscardOpen(true);
    else onClose();
  };

  // Reinicia o formulário somente ao abrir um novo editor. Quando a lista de igrejas
  // chega depois, atualiza os valores padrão sem apagar o que já foi digitado.
  useEffect(() => {
    if (!editor) {
      lastEditorRef.current = null;
      return;
    }
    const initial = defaults(editor, churches);
    if (lastEditorRef.current !== editor) {
      lastEditorRef.current = editor;
      reset(initial);
      previousStartRef.current = initial.startTime;
      setDetailsOpen(Boolean(initial.description));
    } else {
      reset(initial, { keepDirtyValues: true });
    }
  }, [churches, editor, reset]);

  // Ao mudar a data, um único dia da semana ainda não escolhido manualmente
  // acompanha a nova data. Séries com vários dias são preservadas.
  const dateDirty = Boolean(dirtyFields.date);
  const weekdaysDirty = Array.isArray(dirtyFields.repeatWeekdays)
    ? dirtyFields.repeatWeekdays.some(Boolean)
    : Boolean(dirtyFields.repeatWeekdays);
  useEffect(() => {
    if (!editor || !values.date || !dateDirty || weekdaysDirty) return;
    const current = getValues("repeatWeekdays") ?? [];
    const next = weekdayOf(values.date);
    if (current.length <= 1 && current[0] !== next) setValue("repeatWeekdays", [next]);
  }, [dateDirty, editor, getValues, setValue, values.date, weekdaysDirty]);

  // Erros de validação do servidor aparecem junto aos campos correspondentes.
  useEffect(() => {
    if (!error?.fields) return;
    for (const [field, messages] of Object.entries(error.fields)) {
      const target = serverFieldMap[field];
      if (target && messages.length) setError(target, { type: "server", message: messages[0] });
    }
  }, [error, setError]);

  useEffect(() => {
    if (!editor) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // No mobile, focus the close control instead of opening the virtual keyboard.
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const timer = window.setTimeout(() => {
      if (contentRef.current) contentRef.current.scrollTop = 0;
      if (isMobile) closeButtonRef.current?.focus();
      else panelRef.current?.querySelector<HTMLElement>("input")?.focus();
    }, 0);
    const listener = (event: KeyboardEvent) => {
      const topModal = Array.from(
        document.querySelectorAll<HTMLElement>('[aria-modal="true"]'),
      ).at(-1);
      if (topModal !== panelRef.current) return;
      if (event.key === "Escape" && !pendingRef.current) {
        event.preventDefault();
        requestCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
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
    };
    document.addEventListener("keydown", listener);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", listener);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [editor]);

  if (!editor) return null;

  const submit = handleSubmit(async (formValues) => {
    const selectedDate = new Date(`${formValues.date}T12:00:00`);
    const location =
      formValues.locationChoice === "__other"
        ? formValues.location.trim()
        : formValues.locationChoice.trim();
    await onSubmit({
      title: formValues.title.trim(),
      description: formValues.description.trim() || undefined,
      location: location || undefined,
      start: `${formValues.date}T${formValues.startTime}:00`,
      end: formValues.endTime ? `${formValues.date}T${formValues.endTime}:00` : undefined,
      type: formValues.type,
      repeat: formValues.repeat,
      repeatUntil:
        formValues.repeat !== "none" && formValues.repeatUntil
          ? formValues.repeatUntil
          : undefined,
      repeatWeekdays:
        formValues.repeat === "weekly" ? [...formValues.repeatWeekdays].sort() : undefined,
      repeatMonthDay:
        formValues.repeat === "monthly" ? selectedDate.getDate() : undefined,
    });
  });

  // Mantém a duração ao mover o início, quando o término continua no mesmo dia.
  const startTimeField = register("startTime", {
    required: "Informe o início.",
    deps: ["endTime"],
    onChange: () => {
      const nextStart = getValues("startTime");
      const previousStart = previousStartRef.current;
      previousStartRef.current = nextStart;
      const end = getValues("endTime");
      const duration = minutesOf(end) - minutesOf(previousStart);
      if (!end || !previousStart || !nextStart || duration <= 0) return;
      const nextEnd = minutesOf(nextStart) + duration;
      if (nextEnd < 24 * 60) setValue("endTime", timeOf(nextEnd), { shouldDirty: true, shouldValidate: true });
    },
  });

  const fieldClass = fieldClassName;
  const labelClass = labelClassName;
  const isDuplicate = editor.kind === "create" && Boolean(editor.source);
  const isSeriesEdit = editor.kind === "edit" && editor.event.repeat !== "none";
  const unchangedEdit = editor.kind === "edit" && !isDirty;
  const durationLabel = formatDuration(values.startTime, values.endTime);
  const recurrenceSummary = describeRecurrence(values);
  const generalError = error
    ? hasMappedFieldErrors(error)
      ? "Revise os campos indicados e tente novamente."
      : error.message || "Não foi possível salvar. Tente novamente."
    : undefined;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 md:items-center md:p-5"
      onMouseDown={(event) =>
        event.target === event.currentTarget && requestCloseRef.current()
      }
    >
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-form-title"
        aria-busy={pending}
        className="admin-theme flex h-dvh w-full flex-col overflow-hidden bg-white pt-[env(safe-area-inset-top)] shadow-2xl md:h-auto md:max-h-[94dvh] md:max-w-3xl md:rounded-2xl md:pt-0"
      >
        <UnsavedChanges dirty={isDirty} />
        <header className="flex items-center justify-between border-b border-line/60 bg-white px-4 py-3 md:px-6 md:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-selection/50 text-primary">
              <CalendarClock size={19} />
            </span>
            <div className="min-w-0">
              <h2 id="event-form-title" className="m-0 font-display text-2xl font-medium leading-tight tracking-tight">
                {editor.kind === "edit"
                  ? "Editar evento"
                  : isDuplicate
                    ? "Duplicar evento"
                    : "Novo evento"}
              </h2>
              <p className="m-0 mt-1 text-sm text-muted">{formatDateLabel(values.date)}</p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Fechar formulário"
            onClick={() => requestCloseRef.current()}
            disabled={pending}
            className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-transparent p-0 text-muted hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div ref={contentRef} className="flex-1 scroll-pb-24 overflow-y-auto bg-white pb-4">
            <fieldset disabled={pending} className="m-0 grid min-w-0 content-start border-0 p-0">
            {isSeriesEdit ? (
              <div className="mx-4 mt-4 flex gap-3 rounded-xl border border-line bg-accent px-4 py-3 text-sm text-accent-ink sm:mx-6">
                <AlertTriangle size={17} aria-hidden="true" className="mt-0.5 flex-none text-accent-ink" />
                <p className="m-0">
                  <strong className="font-bold">Este evento se repete.</strong>{" "}
                  Salvar altera toda a série, que passa a começar em{" "}
                  {formatShortDate(values.date)}. Ocorrências anteriores a essa data deixam de aparecer na agenda.
                </p>
              </div>
            ) : null}

            <FormSection title="Informações principais" icon={<Info size={15} />}>
              <label className={labelClass}>
                Título
                <input
                  {...register("title", {
                    required: "Informe o título do evento.",
                    validate: (value) =>
                      value.trim().length >= 3 || "Use pelo menos 3 caracteres.",
                  })}
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={errors.title ? "event-title-error" : undefined}
                  className={`${fieldClass} text-base font-semibold`}
                  placeholder="Ex.: Santa Missa"
                  autoComplete="off"
                />
                {errors.title ? <FieldError id="event-title-error">{errors.title.message}</FieldError> : null}
              </label>

              <label className={labelClass}>
                Tipo
                <select {...register("type")} aria-label="Tipo" className={fieldClass}>
                  {typeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            </FormSection>

            <FormSection title="Data e horário" icon={<Clock3 size={15} />}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1.25fr_1fr_1fr]">
                <label className={`${labelClass} col-span-2 sm:col-span-1`}>
                  Data
                  <input
                    type="date"
                    {...register("date", { required: "Informe a data." })}
                    aria-invalid={Boolean(errors.date)}
                    aria-describedby={errors.date ? "event-date-error" : undefined}
                    className={fieldClass}
                  />
                  {errors.date ? <FieldError id="event-date-error">{errors.date.message}</FieldError> : null}
                </label>
                <label className={labelClass}>
                  Início
                  <input
                    type="time"
                    {...startTimeField}
                    aria-invalid={Boolean(errors.startTime)}
                    aria-describedby={errors.startTime ? "event-start-error" : undefined}
                    className={fieldClass}
                  />
                  {errors.startTime ? <FieldError id="event-start-error">{errors.startTime.message}</FieldError> : null}
                </label>
                <label className={labelClass}>
                  Término{" "}
                  <span className="font-medium text-muted">(opcional)</span>
                  <input
                    type="time"
                    {...register("endTime", {
                      validate: (value, formValues) =>
                        !value ||
                        !formValues.startTime ||
                        value > formValues.startTime ||
                        "Deve ser após o início.",
                    })}
                    aria-invalid={Boolean(errors.endTime)}
                    aria-describedby={errors.endTime ? "event-end-error" : "event-duration"}
                    className={fieldClass}
                  />
                  {errors.endTime ? (
                    <FieldError id="event-end-error">{errors.endTime.message}</FieldError>
                  ) : null}
                </label>
              </div>
              <p id="event-duration" className="m-0 text-sm text-muted" aria-live="polite">
                {durationLabel}
              </p>
            </FormSection>

            <FormSection title="Local" icon={<MapPin size={15} />}>
              <div>
                <p className={`${labelClass} mb-1.5`}>Igreja ou espaço</p>
                <Controller
                  control={control}
                  name="locationChoice"
                  render={({ field }) => {
                    const locationOptions: Array<{ value: string; label: string }> = [
                      { value: "", label: "Local a definir" },
                      ...churches.map((c) => ({ value: c.nome, label: c.nome })),
                      { value: "__other", label: "Outro local..." },
                    ];
                    const selected = locationOptions.find((o) => o.value === field.value);
                    return (
                      <SelectSheet
                        label="Igreja ou espaço"
                        eyebrow="Local do evento"
                        options={locationOptions}
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value);
                          // Focus the custom location only when it was explicitly chosen,
                          // never merely because an existing event already has one.
                          if (value === "__other") window.setTimeout(() => setFocus("location"), 0);
                        }}
                        placeholder="Local a definir"
                        displayValue={selected?.label}
                        status={churchesStatus}
                        disabled={pending}
                      />
                    );
                  }}
                />
                {churchesStatus === "error" ? (
                  <p className="m-0 mt-1.5 text-sm text-muted">
                    Não foi possível carregar as igrejas cadastradas. Use “Outro local...” para informar o nome.
                  </p>
                ) : null}
              </div>
              {locationChoice === "__other" ? (
                <label className={labelClass}>
                  Nome do local
                  <input
                    {...register("location", {
                      validate: (value, formValues) =>
                        formValues.locationChoice !== "__other" || value.trim()
                          ? true
                          : "Informe o local.",
                    })}
                    aria-invalid={Boolean(errors.location)}
                    aria-describedby={errors.location ? "event-location-error" : undefined}
                    className={fieldClass}
                    placeholder="Ex.: Salão paroquial"
                  />
                  {errors.location ? (
                    <FieldError id="event-location-error">{errors.location.message}</FieldError>
                  ) : null}
                </label>
              ) : null}
            </FormSection>

            <FormSection title="Repetição" icon={<Repeat2 size={15} />}>
              <div
                className="grid grid-cols-3 gap-2"
                role="radiogroup"
                aria-label="Repetição do evento"
              >
                {(
                  [
                    ["none", "Não repetir"],
                    ["weekly", "Semanal"],
                    ["monthly", "Mensal"],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className={classNames(
                      "flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-2 py-2.5 text-center text-sm font-bold transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary",
                      repeat === value
                        ? "border-focus bg-canvas text-primary-hover"
                        : "border-control-border bg-surface text-muted hover:border-muted",
                    )}
                  >
                    <input
                      type="radio"
                      value={value}
                      {...register("repeat")}
                      className="sr-only"
                    />
                    {label}
                  </label>
                ))}
              </div>

              {repeat === "weekly" ? (
                <Controller
                  control={control}
                  name="repeatWeekdays"
                  rules={{
                    validate: (value) =>
                      getValues("repeat") !== "weekly" || value.length > 0 || "Escolha pelo menos um dia.",
                  }}
                  render={({ field, fieldState }) => (
                    <fieldset
                      className="m-0 min-w-0 border-0 p-0"
                      aria-describedby={fieldState.error ? "event-weekdays-error" : undefined}
                    >
                      <legend className={`${labelClass} mb-2`}>Dias da semana</legend>
                      <div className="grid grid-cols-7 gap-1.5">
                        {weekdayOptions.map((day) => {
                          const checked = field.value?.includes(day.value) ?? false;
                          return (
                            <label
                              key={day.value}
                              className={classNames(
                                "flex min-h-11 cursor-pointer items-center justify-center rounded-xl border text-sm font-bold transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary",
                                checked
                                  ? "border-focus bg-canvas text-primary-hover"
                                  : "border-control-border bg-surface text-muted hover:border-muted",
                              )}
                            >
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={checked}
                                aria-label={day.long}
                                onChange={(event) => {
                                  const current = field.value ?? [];
                                  field.onChange(
                                    event.target.checked
                                      ? [...current, day.value]
                                      : current.filter((item) => item !== day.value),
                                  );
                                }}
                                onBlur={field.onBlur}
                              />
                              <span aria-hidden="true">{day.short}</span>
                            </label>
                          );
                        })}
                      </div>
                      {fieldState.error ? (
                        <FieldError id="event-weekdays-error">{fieldState.error.message}</FieldError>
                      ) : null}
                    </fieldset>
                  )}
                />
              ) : null}

              {repeat !== "none" ? (
                <label className={labelClass}>
                  Repetir até
                  <input
                    type="date"
                    min={values.date}
                    {...register("repeatUntil", {
                      validate: (value, formValues) =>
                        formValues.repeat === "none" ||
                        (Boolean(value) && value >= formValues.date) ||
                        "Escolha uma data igual ou posterior ao evento.",
                    })}
                    aria-invalid={Boolean(errors.repeatUntil)}
                    aria-describedby={errors.repeatUntil ? "event-repeat-error" : undefined}
                    className={fieldClass}
                  />
                  {errors.repeatUntil ? (
                    <FieldError id="event-repeat-error">{errors.repeatUntil.message}</FieldError>
                  ) : null}
                </label>
              ) : null}

              {recurrenceSummary ? (
                <p
                  className="m-0 rounded-xl bg-canvas px-3.5 py-3 text-sm text-ink"
                  aria-live="polite"
                  data-testid="recurrence-summary"
                >
                  {recurrenceSummary}
                </p>
              ) : null}
            </FormSection>

            <div className="border-b border-line px-4 py-2 sm:px-6">
              <button
                type="button"
                onClick={() => setDetailsOpen((open) => !open)}
                aria-expanded={detailsOpen}
                aria-controls="event-description-panel"
                className="flex min-h-12 w-full items-center justify-between gap-3 text-left text-sm font-bold text-ink"
              >
                <span>{detailsOpen ? "Descrição" : "Adicionar descrição"}</span>
                <ChevronDown
                  size={16}
                  className={`transition ${detailsOpen ? "rotate-180" : ""}`}
                />
              </button>
              {detailsOpen ? (
                <div id="event-description-panel" className="pb-3">
                  <textarea
                    {...register("description")}
                    aria-label="Descrição do evento"
                    rows={4}
                    className={`${fieldClass} mt-0 resize-y`}
                    placeholder="Orientações e informações úteis"
                  />
                </div>
              ) : null}
            </div>
            </fieldset>
          </div>

          {generalError ? (
            <AdminNotice className="mx-4 mt-3 md:mx-6">{generalError}</AdminNotice>
          ) : null}

          <footer className="flex flex-wrap items-center gap-2 border-t border-line bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-4 sm:pb-4">
            {editor.kind === "edit" ? (
              <button
                type="button"
                onClick={onDelete}
                disabled={pending}
                aria-label="Excluir evento"
                className="inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-danger transition hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger disabled:opacity-60"
              >
                <Trash2 size={16} aria-hidden="true" />
                <span className="hidden md:inline">Excluir</span>
              </button>
            ) : null}
            {unchangedEdit ? (
              <p className="m-0 hidden text-sm text-muted md:block">Nenhuma alteração para salvar</p>
            ) : null}
            <button
              type="button"
              onClick={() => requestCloseRef.current()}
              disabled={pending}
              className={`${buttonClasses.secondary.md} md:ml-auto`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending || unchangedEdit}
              className={`${buttonClasses.primary.md} flex-1 disabled:cursor-not-allowed disabled:bg-line disabled:text-muted md:min-w-44 md:flex-none`}
            >
              {pending ? <LoaderCircle size={15} aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}
              {pending
                ? "Salvando..."
                : editor.kind === "edit"
                  ? "Salvar alterações"
                  : isDuplicate
                    ? "Criar cópia"
                    : "Criar evento"}
            </button>
          </footer>
        </form>
      </section>
      {discardOpen ? <DiscardChangesDialog onStay={() => setDiscardOpen(false)} onLeave={() => { setDiscardOpen(false); onClose(); }} /> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SelectSheet — botão que abre bottom-sheet (mobile) ou diálogo (desktop) com opções
// ---------------------------------------------------------------------------

type SelectOption = { value: string; label: string };

function SelectSheet({
  label,
  eyebrow,
  options,
  value,
  onChange,
  placeholder,
  displayValue,
  status = "ready",
  disabled = false,
}: {
  label: string;
  eyebrow: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  displayValue?: string;
  status?: ChurchesStatus;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLElement>(null);
  const closeSheetButtonRef = useRef<HTMLButtonElement>(null);

  // Fecha no Escape, contém o foco e trava o scroll enquanto aberto.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => closeSheetButtonRef.current?.focus(), 0);
    const onKey = (event: KeyboardEvent) => {
      const topModal = Array.from(
        document.querySelectorAll<HTMLElement>('[aria-modal="true"]'),
      ).at(-1);
      if (topModal !== sheetRef.current) return;
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        sheetRef.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ?? [],
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
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open]);

  const isEmpty = !value;
  const isOther = value === "__other";
  const shown = displayValue ?? placeholder ?? "Selecionar";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-label={`${label}: ${shown}`}
        className={`${fieldClasses.lg} mt-1.5 flex items-center justify-between gap-3 text-left text-sm`}
      >
        <span
          className={classNames(
            "truncate text-left",
            isEmpty ? "text-muted" : isOther ? "font-medium text-ink" : "font-semibold text-ink",
          )}
        >
          {shown}
        </span>
        <ChevronRight size={15} className="flex-none text-muted" />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[75] flex items-end justify-center bg-black/30 md:items-center md:p-5"
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <section
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="max-h-[70dvh] w-full overflow-y-auto rounded-t-2xl bg-white pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3 shadow-2xl md:max-w-md md:rounded-2xl md:pb-3"
          >
            <div aria-hidden="true" className="mb-2 flex justify-center md:hidden">
              <span className="h-1 w-10 rounded-full bg-line" />
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-line px-4 pb-3">
              <div>
                <h2 className="m-0 text-base font-semibold text-ink">{label}</h2>
                <p className="m-0 mt-1 text-sm text-muted">{eyebrow}</p>
              </div>
              <button
                ref={closeSheetButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-canvas text-muted"
              >
                <X size={17} />
              </button>
            </div>

            {status === "loading" ? (
              <p className="m-0 flex items-center gap-2 px-5 pt-3 text-sm text-muted" role="status">
                <LoaderCircle size={14} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
                Carregando igrejas cadastradas…
              </p>
            ) : status === "error" ? (
              <p className="m-0 px-5 pt-3 text-sm text-muted" role="status">
                Igrejas cadastradas indisponíveis no momento.
              </p>
            ) : null}

            <ul role="listbox" aria-label={label} className="grid gap-0 px-2 py-2">
              {options.map((opt) => {
                const selected = opt.value === value;
                return (
                  <li key={opt.value} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      className={classNames(
                        "flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 text-sm transition hover:bg-selection/35 active:bg-canvas",
                        selected
                          ? "bg-canvas font-bold text-primary-hover"
                          : opt.value === "__other"
                            ? "font-medium text-muted"
                            : "font-semibold text-ink",
                      )}
                    >
                      <span className="truncate">{opt.label}</span>
                      {selected ? (
                        <Check size={16} className="flex-none text-primary" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------

function FormSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-3 border-b border-line px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
      <h3 className="m-0 flex items-center gap-2 text-sm font-bold text-ink">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-canvas text-primary">
          {icon}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function FieldError({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <span id={id} className={fieldErrorClassName}>{children}</span>
  );
}

function hasMappedFieldErrors(error: EventFormError) {
  return Object.entries(error.fields ?? {}).some(([field, messages]) => serverFieldMap[field] && messages.length);
}

function normalize(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function minutesOf(time?: string) {
  if (!time) return Number.NaN;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function timeOf(totalMinutes: number) {
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
}

function formatDuration(start?: string, end?: string) {
  if (!start) return "";
  if (!end) return "Sem horário de término definido.";
  const total = minutesOf(end) - minutesOf(start);
  if (!(total > 0)) return "";
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  const label = hours && minutes ? `${hours}h${String(minutes).padStart(2, "0")}` : hours ? `${hours}h` : `${minutes} min`;
  return `Duração: ${label}`;
}

/** Descreve a repetição em linguagem natural, com a quantidade estimada de ocorrências. */
function describeRecurrence(values: Pick<Values, "repeat" | "date" | "startTime" | "repeatUntil" | "repeatWeekdays">) {
  if (values.repeat === "none" || !values.date) return "";
  const until = values.repeatUntil && values.repeatUntil >= values.date ? values.repeatUntil : "";
  const time = values.startTime ? ` às ${values.startTime}` : "";
  const day = new Date(`${values.date}T12:00:00`).getDate();
  let rule: string;
  if (values.repeat === "weekly") {
    const selected = weekdayOptions.filter((option) => values.repeatWeekdays?.includes(option.value));
    if (!selected.length) return "";
    rule = selected.length === 7
      ? `Repete todos os dias${time}`
      : `Repete às ${new Intl.ListFormat("pt-BR", { type: "conjunction" }).format(selected.map((option) => option.plural))}${time}`;
  } else {
    rule = `Repete todo dia ${day} de cada mês${time}`;
  }
  if (!until) return `${rule}. Escolha até quando repetir.`;
  const count = countOccurrences(values.repeat, values.date, until, values.repeatWeekdays ?? []);
  const countLabel = count === 1 ? "1 ocorrência" : `${count} ocorrências`;
  const shortMonthsHint = values.repeat === "monthly" && day > 28 ? " Meses sem esse dia ficam sem o evento." : "";
  return `${rule}, até ${formatShortDate(until)} (${countLabel}).${shortMonthsHint}`;
}

function countOccurrences(repeat: RepeatOption, start: string, until: string, weekdays: number[]) {
  const cursor = new Date(`${start}T12:00:00`);
  const last = new Date(`${until}T12:00:00`);
  const day = cursor.getDate();
  let count = 0;
  // Limite de segurança: aproximadamente 10 anos.
  for (let guard = 0; cursor <= last && guard < 3700; guard += 1) {
    if (repeat === "weekly" ? weekdays.includes(cursor.getDay()) : cursor.getDate() === day) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

function formatShortDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T12:00:00`));
}

function formatDateLabel(value?: string) {
  if (!value) return "Agenda administrativa";
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(date);
}
