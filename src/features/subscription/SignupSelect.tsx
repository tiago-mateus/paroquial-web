import { Check, ChevronDown, X } from "lucide-react";
import { useRef, type KeyboardEvent } from "react";
import { fieldClass } from "./SubscriptionShell";

type Option<Value extends string> = { value: Value; label: string };

export function SignupSelect<Value extends string>({ id, label, value, options, displayValue, error, onChange }: {
  id: string;
  label: string;
  value: Value;
  options: readonly Option<Value>[];
  displayValue?: string;
  error?: string;
  onChange: (value: Value) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const current = displayValue ?? options.find(option => option.value === value)?.label ?? "Selecionar";
  const optionClass = "flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm font-semibold hover:bg-selection/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

  function open() {
    const panel = dialog.current;
    if (!panel) return;
    panel.showModal();
    panel.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
  }

  function moveFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    const items = Array.from(event.currentTarget.querySelectorAll("button"));
    const index = items.findIndex(item => item === document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
      : Math.max(0, Math.min(items.length - 1, index + (event.key === "ArrowUp" ? -1 : 1)));
    items[next]?.focus();
  }

  return <>
    <button ref={trigger} id={id} type="button" aria-label={label + ": " + current} aria-haspopup="dialog" aria-controls={id + "-picker"}
      aria-invalid={Boolean(error)} aria-describedby={error ? id + "-error" : undefined}
      onClick={open} className={fieldClass + " flex items-center justify-between gap-2 text-left"}>
      <span className="min-w-0 truncate">{current}</span>
      <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-muted" />
    </button>
    <dialog ref={dialog} id={id + "-picker"} aria-labelledby={id + "-picker-title"} onClose={() => trigger.current?.focus()}
      onClick={event => { if (event.currentTarget === event.target) dialog.current?.close(); }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[70dvh] w-full max-w-none overflow-hidden rounded-t-2xl border border-line bg-surface p-0 text-ink shadow-lg backdrop:bg-ink/35 sm:inset-0 sm:m-auto sm:max-w-md sm:rounded-2xl">
      <div className="flex max-h-[70dvh] flex-col">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-4 py-2">
          <h2 id={id + "-picker-title"} className="m-0 font-display text-xl">{label}</h2>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="Fechar opções"
            className="grid size-11 place-items-center rounded-xl text-muted hover:bg-selection focus-visible:outline-2 focus-visible:outline-focus"><X size={18} aria-hidden="true" /></button>
        </header>
        <div onKeyDown={moveFocus} className="min-h-0 overflow-y-auto overscroll-contain px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
          {options.map(option => (
            <button key={option.value} type="button" aria-pressed={option.value === value} onClick={() => { onChange(option.value); dialog.current?.close(); }}
              className={optionClass + (option.value === value ? " bg-selection text-primary" : "")}>
              <span>{option.label}</span>
              {option.value === value ? <Check size={17} className="shrink-0" aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      </div>
    </dialog>
  </>;
}
