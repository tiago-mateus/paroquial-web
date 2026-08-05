import { CalendarDays, Church, Home, Link2 } from "lucide-react";
import { NavLink, Outlet, useParams } from "react-router-dom";

const navigationItems = [
  { label: "Início", path: "", icon: Home, end: true },
  { label: "Agenda", path: "calendario", icon: CalendarDays },
  { label: "Igrejas", path: "igrejas", icon: Church },
  { label: "Links", path: "links", icon: Link2 },
] as const;

export function PublicLayout() {
  const { tenantSlug = "" } = useParams();

  return (
    <div className="app-shell bg-white">
      <Outlet />
      <nav
        aria-label="Navegação principal da paróquia"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-100/90 bg-white/95 pb-[calc(env(safe-area-inset-bottom,0px)+4px)] backdrop-blur-xl md:hidden"
      >
        <div className="mx-auto grid h-[3.75rem] max-w-md grid-cols-4 items-center gap-1 px-2 pt-1">
          {navigationItems.map(({ label, path, icon: Icon, ...item }) => (
            <NavLink
              key={label}
              end={"end" in item ? item.end : false}
              to={path ? `/${tenantSlug}/${path}` : `/${tenantSlug}`}
              className={({ isActive }) =>
                [
                  "group flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-amber-500/40",
                  isActive ? "text-amber-800" : "text-slate-400 hover:text-slate-700",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 transition",
                      isActive ? "bg-amber-100 text-amber-800" : "group-hover:bg-slate-100",
                    ].join(" ")}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  </span>
                  <span className="max-w-full truncate text-[0.68rem] font-semibold leading-none">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
