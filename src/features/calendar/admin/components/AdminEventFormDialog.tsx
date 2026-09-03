import { CalendarClock, Check, ChevronDown, ChevronRight, Clock3, Info, MapPin, Repeat2, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { PublicChurch } from "../../../../shared/api/churches";
import type { CalendarEvent, CreateEventRequest, EventType, RepeatOption } from "../../../../shared/api/events";
import { classNames } from "../../../../shared/lib/classNames";

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
};

export type EventEditor =
  | { kind: "create"; date: Date; source?: CalendarEvent }
  | { kind: "edit"; event: CalendarEvent };

const typeOptions: Array<[EventType, string]> = [
  ["missa", "Missa"],
  ["novena", "Novena"],
  ["reuniao", "Reunião"],
  ["encontro", "Encontro"],
  ["adoracao", "Adoração"],
  ["movimento", "Movimento"],
  ["outro", "Outro"],
];

function dateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function timeValue(value?: string) {
  return value ? value.slice(11, 16) : "";
}
function defaults(editor: EventEditor, churches: PublicChurch[]): Values {
  const event = editor.kind === "edit" ? editor.event : editor.source;
  const location = event?.location ?? "";
  const registeredLocation = churches.find(
    (church) => normalize(church.nome) === normalize(location),
  )?.nome;
  return {
    title: event?.title ?? "",
    description: event?.description ?? "",
    location,
    locationChoice: registeredLocation ?? (location ? "__other" : ""),
    date:
      editor.kind === "edit" ? editor.event.start.slice(0, 10) : dateValue(editor.date),
    startTime: timeValue(event?.start) || "18:00",
    endTime: timeValue(event?.end) || "19:00",
    type: event?.type ?? "missa",
    repeat: editor.kind === "edit" ? editor.event.repeat : "none",
    repeatUntil:
      editor.kind === "edit" ? (editor.event.repeatUntil?.slice(0, 10) ?? "") : "",
  };
}

// --- Swipe-to-close hook ---
function useSwipeToClose(
  ref: React.RefObject<HTMLElement | null>,
  onClose: () => void,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    let startY = 0;
    let currentY = 0;
    let dragging = false;

    function onTouchStart(e: TouchEvent) {
      // Only initiate swipe if the touch starts near the top (drag handle area)
      const touch = e.touches[0];
      const rect = el!.getBoundingClientRect();
      if (touch.clientY - rect.top > 56) return; // only top 56px
      startY = touch.clientY;
      dragging = true;
    }
    function onTouchMove(e: TouchEvent) {
      if (!dragging) return;
      currentY = e.touches[0].clientY;
      const delta = currentY - startY;
      if (delta > 0) {
        (el as HTMLElement).style.transform = `translateY(${delta}px)`;
        (el as HTMLElement).style.transition = "none";
      }
    }
    function onTouchEnd() {
      if (!dragging) return;
      dragging = false;
      const delta = currentY - startY;
      (el as HTMLElement).style.transform = "";
      (el as HTMLElement).style.transition = "";
      if (delta > 80) {
        onClose();
      }
    }
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [ref, onClose, enabled]);
}

export function AdminEventFormDialog({
  editor,
  churches,
  pending,
  error,
  onClose,
  onSubmit,
  onDelete,
}: {
  editor: EventEditor | null;
  churches: PublicChurch[];
  pending: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (input: CreateEventRequest) => Promise<void>;
  onDelete: () => void;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm<Values>();
  const values = watch();
  const repeat = values.repeat;
  const locationChoice = values.locationChoice;

  // Swipe-to-close on mobile (only when not pending)
  useSwipeToClose(panelRef, onClose, Boolean(editor) && !pending);

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
    // No mobile, focus the close control instead of opening the virtual keyboard.
    const isMobile = window.matchMedia("(max-width: 639px)").matches;
    const timer = window.setTimeout(() => {
      if (isMobile) closeButtonRef.current?.focus();
      else panelRef.current?.querySelector<HTMLElement>("input")?.focus();
    }, 0);
    const listener = (event: KeyboardEvent) => {
      const topModal = Array.from(
        document.querySelectorAll<HTMLElement>('[aria-modal="true"]'),
      ).at(-1);
      if (topModal !== panelRef.current) return;
      if (event.key === "Escape" && !pending) {
        onClose();
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
  }, [editor, onClose, pending]);

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
        formValues.repeat === "weekly" ? [selectedDate.getDay()] : undefined,
      repeatMonthDay:
        formValues.repeat === "monthly" ? selectedDate.getDate() : undefined,
    });
  });

  const fieldClass =
    "mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-amber-400 focus:ring-3 focus:ring-amber-100";
  const labelClass = "text-xs font-bold text-slate-700";
  const isDuplicate = editor.kind === "create" && Boolean(editor.source);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-end bg-slate-950/35 backdrop-blur-[1px] sm:items-stretch"
      onMouseDown={(event) =>
        event.target === event.currentTarget && !pending && onClose()
      }
    >
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-form-title"
        className="flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:h-full sm:max-h-none sm:max-w-[38rem] sm:rounded-none"
      >
        {/* Drag handle — mobile only */}
        <div
          aria-hidden="true"
          className="flex justify-center pb-1 pt-3 sm:hidden"
        >
          <span className="h-1 w-10 rounded-full bg-slate-200" />
        </div>

        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-2xl bg-amber-100 text-amber-800">
              <CalendarClock size={19} />
            </span>
            <div className="min-w-0">
              <p className="m-0 truncate text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-amber-700">
                {formatDateLabel(values.date)}
              </p>
              <h2 id="event-form-title" className="m-0 text-lg font-bold">
                {editor.kind === "edit"
                  ? "Editar evento"
                  : isDuplicate
                    ? "Duplicar evento"
                    : "Novo evento"}
              </h2>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Fechar formulário"
            onClick={onClose}
            disabled={pending}
            className="grid h-11 w-11 flex-none place-items-center rounded-full bg-slate-100 p-0 text-slate-600 hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid flex-1 scroll-pb-24 content-start overflow-y-auto bg-white pb-4">
            {/* Título */}
            <FormSection title="Informações principais" icon={<Info size={15} />}>
              <label className={labelClass}>
                Título
                <input
                  {...register("title", {
                    required: "Informe o título do evento.",
                    validate: (value) =>
                      value.trim().length >= 3 || "Use pelo menos 3 caracteres.",
                  })}
                  className={`${fieldClass} text-base font-semibold`}
                  placeholder="Ex.: Santa Missa"
                />
                {errors.title ? <FieldError>{errors.title.message}</FieldError> : null}
              </label>

              {/* Tipo como chips em vez de select */}
              <fieldset>
                <legend className={`${labelClass} mb-2`}>Tipo</legend>
                <div className="flex flex-wrap gap-2">
                  {typeOptions.map(([value, label]) => (
                    <label
                      key={value}
                      className={classNames(
                        "inline-flex min-h-11 cursor-pointer items-center rounded-xl border px-3 py-2 text-xs font-bold transition",
                        values.type === value
                          ? "border-amber-300 bg-amber-50 text-amber-900"
                          : "border-slate-200 bg-white text-slate-600 active:bg-slate-50",
                      )}
                    >
                      <input
                        type="radio"
                        value={value}
                        {...register("type")}
                        className="sr-only"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </FormSection>

            {/* Data e horário */}
            <FormSection title="Data e horário" icon={<Clock3 size={15} />}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1.25fr_1fr_1fr]">
                <label className={`${labelClass} col-span-2 sm:col-span-1`}>
                  Data
                  <input
                    type="date"
                    {...register("date", { required: "Informe a data." })}
                    className={fieldClass}
                  />
                  {errors.date ? <FieldError>{errors.date.message}</FieldError> : null}
                </label>
                <label className={labelClass}>
                  Início
                  <input
                    type="time"
                    {...register("startTime", { required: "Informe o início." })}
                    className={fieldClass}
                  />
                </label>
                <label className={labelClass}>
                  Término{" "}
                  <span className="font-medium text-slate-400">(opcional)</span>
                  <input
                    type="time"
                    {...register("endTime", {
                      validate: (value) =>
                        !value ||
                        !values.startTime ||
                        value > values.startTime ||
                        "Deve ser após o início.",
                    })}
                    className={fieldClass}
                  />
                  {errors.endTime ? (
                    <FieldError>{errors.endTime.message}</FieldError>
                  ) : null}
                </label>
              </div>
            </FormSection>

            {/* Local */}
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
                        options={locationOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Local a definir"
                        displayValue={selected?.label}
                      />
                    );
                  }}
                />
              </div>
              {locationChoice === "__other" ? (
                <label className={labelClass}>
                  Nome do local
                  <input
                    {...register("location", {
                      validate: (value) =>
                        locationChoice !== "__other" || value.trim()
                          ? true
                          : "Informe o local.",
                    })}
                    className={fieldClass}
                    placeholder="Ex.: Salão paroquial"
                    autoFocus
                  />
                  {errors.location ? (
                    <FieldError>{errors.location.message}</FieldError>
                  ) : null}
                </label>
              ) : null}
            </FormSection>

            {/* Repetição */}
            <FormSection title="Repetição" icon={<Repeat2 size={15} />}>
              <div
                className="grid grid-cols-3 gap-2"
                role="group"
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
                      "flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-2 py-2.5 text-center text-xs font-bold transition",
                      repeat === value
                        ? "border-amber-300 bg-amber-50 text-amber-900"
                        : "border-slate-200 bg-white text-slate-600",
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
              {repeat !== "none" ? (
                <label className={labelClass}>
                  Repetir até
                  <input
                    type="date"
                    min={values.date}
                    {...register("repeatUntil", {
                      validate: (value) =>
                        (Boolean(value) && value >= values.date) ||
                        "Escolha uma data igual ou posterior ao evento.",
                    })}
                    className={fieldClass}
                  />
                  {errors.repeatUntil ? (
                    <FieldError>{errors.repeatUntil.message}</FieldError>
                  ) : null}
                </label>
              ) : null}
            </FormSection>

            {/* Descrição */}
            <div className="border-b border-slate-100 px-4 py-2 sm:px-6">
              <button
                type="button"
                onClick={() => setDetailsOpen((open) => !open)}
                aria-expanded={detailsOpen}
                className="flex min-h-12 w-full items-center justify-between gap-3 text-left text-sm font-bold text-slate-700"
              >
                <span>{detailsOpen ? "Descrição" : "Adicionar descrição"}</span>
                <ChevronDown
                  size={16}
                  className={`transition ${detailsOpen ? "rotate-180" : ""}`}
                />
              </button>
              {detailsOpen ? (
                <div className="pb-3">
                  <textarea
                    {...register("description")}
                    rows={4}
                    className={`${fieldClass} mt-0 resize-none`}
                    placeholder="Orientações e informações úteis"
                  />
                </div>
              ) : null}
            </div>

            {/* Excluir evento — dentro do formulário, separado do footer */}
            {editor.kind === "edit" ? (
              <div className="px-4 py-3 sm:px-6">
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={pending}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-sm font-bold text-red-700 transition hover:bg-red-100 active:scale-[0.98] disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  Excluir evento
                </button>
              </div>
            ) : null}
          </div>

          {/* Erro de API — acima dos botões de ação, sempre visível */}
          {error ? (
            <p
              role="alert"
              className="mx-4 mb-0 mt-0 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 sm:mx-6"
            >
              {error}
            </p>
          ) : null}

          <footer className="flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-4 sm:pb-4">
            {editor.kind !== "edit" ? (
              <button
                type="button"
                onClick={onClose}
                disabled={pending}
                className="h-11 rounded-xl px-3 text-sm font-bold text-slate-500 hover:bg-slate-50"
              >
                Cancelar
              </button>
            ) : null}
            <button
              type="submit"
              disabled={pending}
              className="h-11 flex-1 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60 sm:flex-none sm:min-w-44"
            >
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// SelectSheet — botão que abre bottom-sheet com opções, sem select nativo
// ---------------------------------------------------------------------------

type SelectOption = { value: string; label: string };

function SelectSheet({
  label,
  options,
  value,
  onChange,
  placeholder,
  displayValue,
}: {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  displayValue?: string;
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
        aria-haspopup="dialog"
        aria-label={`${label}: ${shown}`}
        className="mt-1.5 flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus-visible:border-amber-400 focus-visible:ring-3 focus-visible:ring-amber-100"
      >
        <span
          className={classNames(
            "truncate text-left",
            isEmpty ? "text-slate-400" : isOther ? "font-medium text-slate-700" : "font-semibold text-slate-950",
          )}
        >
          {shown}
        </span>
        <ChevronRight size={15} className="flex-none text-slate-400" />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[75] flex items-end bg-slate-950/35 backdrop-blur-[1px]"
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <section
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="max-h-[70dvh] w-full overflow-y-auto rounded-t-2xl bg-white pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3 shadow-2xl"
          >
            {/* Drag handle */}
            <div aria-hidden="true" className="mb-2 flex justify-center">
              <span className="h-1 w-10 rounded-full bg-slate-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 pb-3">
              <div>
                <p className="m-0 text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-amber-700">
                  Local do evento
                </p>
                <h2 className="m-0 mt-0.5 text-base font-bold text-slate-950">{label}</h2>
              </div>
              <button
                ref={closeSheetButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-slate-100 text-slate-600"
              >
                <X size={17} />
              </button>
            </div>

            {/* Options list */}
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
                        "flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 text-sm transition active:bg-slate-100",
                        selected
                          ? "bg-amber-50 font-bold text-amber-900"
                          : opt.value === "__other"
                            ? "font-medium text-slate-500"
                            : "font-semibold text-slate-800",
                      )}
                    >
                      <span className="truncate">{opt.label}</span>
                      {selected ? (
                        <Check size={16} className="flex-none text-amber-600" />
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
    <section className="grid gap-3 border-b border-slate-100 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
      <h3 className="m-0 flex items-center gap-2 text-sm font-bold text-slate-950">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-50 text-amber-800">
          {icon}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-1 block text-xs font-medium text-red-600">{children}</span>
  );
}

function normalize(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
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
