import { CalendarDays, Church, Home, Link2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import { classNames } from "../lib/classNames";

type PublicNavigationProps = {
  tenantSlug: string;
  variant?: "onImage" | "surface";
  className?: string;
};

export function PublicDesktopNavigation({ tenantSlug, variant = "surface", className }: PublicNavigationProps) {
  const baseHref = `/${tenantSlug}`;
  const items = [
    { label: "Início", href: baseHref, icon: Home, end: true },
    { label: "Agenda", href: `${baseHref}/calendario`, icon: CalendarDays, end: false },
    { label: "Igrejas", href: `${baseHref}/igrejas`, icon: Church, end: false },
    { label: "Links", href: `${baseHref}/links`, icon: Link2, end: false },
  ];
  const onImage = variant === "onImage";

  return (
    <nav
      aria-label="Navegação pública"
      className={classNames(
        "hidden items-center gap-1 rounded-full border p-1 shadow-sm backdrop-blur-xl md:flex",
        onImage ? "border-white/15 bg-black/10" : "border-slate-200/80 bg-white/95",
        className,
      )}
    >
      {items.map(({ icon: Icon, label, href, end }) => (
        <NavLink
          key={label}
          end={end}
          to={href}
          className={({ isActive }) => classNames(
            "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2",
            onImage
              ? isActive
                ? "bg-white text-slate-950 shadow-sm focus-visible:ring-white/80"
                : "text-white/80 hover:bg-white/10 hover:text-white focus-visible:ring-white/80"
              : isActive
                ? "bg-amber-50 text-amber-900 focus-visible:ring-amber-500/40"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 focus-visible:ring-amber-500/40",
          )}
        >
          <Icon size={14} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
