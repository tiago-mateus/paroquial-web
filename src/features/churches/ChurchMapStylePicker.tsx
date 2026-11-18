import { Check, ChevronDown, Layers2, Map, Satellite, Sun } from "lucide-react";
import { useEffect, useId, useRef } from "react";

export type ChurchMapStyle = "light" | "streets" | "satellite";
const options = [
  { value: "light", label: "Mapa claro", icon: Sun },
  { value: "streets", label: "Ruas", icon: Map },
  { value: "satellite", label: "Satélite", icon: Satellite },
] as const;

type Props = {
  value: ChurchMapStyle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: ChurchMapStyle) => void;
};

export function ChurchMapStylePicker({ value, open, onOpenChange, onChange }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelectorAll<HTMLButtonElement>("button")[selectedIndex]?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) onOpenChange(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open, selectedIndex, onOpenChange]);

  function close() {
    onOpenChange(false);
    triggerRef.current?.focus();
  }

  return <div ref={rootRef} className="absolute right-3 top-3 z-30 sm:right-5" onBlur={(event) => {
    if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) onOpenChange(false);
  }} onKeyDown={(event) => {
    if (open && event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); }
  }}>
    <button ref={triggerRef} type="button" aria-label={`Estilo do mapa: ${selected.label}`} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined} onClick={() => onOpenChange(!open)} title={`Estilo do mapa: ${selected.label}`} className={`inline-flex h-11 w-11 items-center justify-center gap-2 rounded-xl border border-line text-sm font-semibold text-primary hover:bg-selection focus-visible:outline-2 focus-visible:outline-focus sm:w-auto sm:px-3 ${open ? "bg-selection" : "bg-surface"}`}>
      <Layers2 size={19} aria-hidden="true" />
      <span className="hidden sm:inline">{selected.label}</span>
      <ChevronDown size={14} aria-hidden="true" className="hidden sm:block" />
    </button>
    {open ? <div className="absolute right-0 top-[calc(100%+0.5rem)] w-56 rounded-xl border border-line bg-surface p-2">
      <p className="mb-1 mt-0 px-3 py-2 text-sm font-semibold text-muted">Estilo do mapa</p>
      <div ref={menuRef} id={menuId} role="menu" aria-label="Estilo do mapa" onKeyDown={(event) => {
        const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
          buttons[next]?.focus();
        }
      }}>
        {options.map(({ value: option, label, icon: Icon }) => <button key={option} type="button" role="menuitemradio" aria-checked={value === option} tabIndex={-1} onClick={() => { onChange(option); close(); }} className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus ${value === option ? "bg-selection font-bold text-primary" : "font-medium text-ink hover:bg-canvas"}`}>
          <Icon size={18} aria-hidden="true" className={value === option ? "text-primary" : "text-muted"} />
          <span className="flex-1">{label}</span>
          {value === option ? <Check size={17} aria-hidden="true" /> : null}
        </button>)}
      </div>
    </div> : null}
  </div>;
}
