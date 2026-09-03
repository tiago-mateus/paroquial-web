import {
  Building2,
  CalendarClock,
  CalendarDays,
  ExternalLink,
  LayoutDashboard,
  Menu,
  Settings2,
  ShieldCheck,
  PanelsTopLeft,
} from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useParams } from "react-router-dom";

const navigationItems = [
  { label: "Visão geral", path: "", icon: LayoutDashboard, end: true },
  { label: "Agenda", path: "calendario", icon: CalendarDays },
  { label: "Site público", path: "site", icon: PanelsTopLeft },
  { label: "Igrejas", path: "igrejas", icon: Building2 },
  { label: "Paróquia", path: "paroquia", icon: ShieldCheck },
  { label: "Horários", path: "horarios", icon: CalendarClock },
  { label: "Configurações", path: "configuracoes", icon: Settings2 },
] as const;

const bottomItems = [
  { label: "Início", path: "", icon: LayoutDashboard, end: true },
  { label: "Agenda", path: "calendario", icon: CalendarDays },
  { label: "Site", path: "site", icon: PanelsTopLeft },
  { label: "Mais", path: "mais", icon: Menu },
] as const;

export function AdminLayout() {
  const { tenantSlug = "" } = useParams();
  const { pathname } = useLocation();
  const adminBase = `/${tenantSlug}/admin`;
  const activeSection = navigationItems.find(({ path }) => path && pathname.startsWith(`${adminBase}/${path}`));
  const sitePageTitle = pathname.endsWith("/pagina-inicial") ? "Página inicial" : pathname.endsWith("/destaques") ? "Destaques" : pathname.endsWith("/canais") ? "Canais oficiais" : undefined;
  const currentTitle = pathname === adminBase ? "Visão geral" : pathname.startsWith(`${adminBase}/mais`) ? "Mais" : sitePageTitle ?? activeSection?.label ?? "Administração";
  const moreActive = ["/mais", "/igrejas", "/paroquia", "/horarios", "/configuracoes"].some((path) => pathname.startsWith(`${adminBase}${path}`));
  const calendarActive = pathname.startsWith(`${adminBase}/calendario`);
  const siteActive = pathname.startsWith(`${adminBase}/site`);

  return (
    <div className="min-h-dvh min-w-0 max-w-full overflow-x-clip bg-stone-50 text-slate-950 md:grid md:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="hidden min-h-dvh flex-col border-r border-slate-200 bg-white px-4 py-5 md:flex">
        <div className="flex items-center gap-3 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-100 text-amber-800"><ShieldCheck size={19} /></span>
          <div><strong className="block text-sm text-slate-950">Paroquial</strong><small className="text-xs text-slate-500">Administração</small></div>
        </div>
        <nav className="mt-8 grid gap-1" aria-label="Navegação administrativa">
          {navigationItems.map(({ label, path, icon: Icon, ...item }) => (
            <div key={label}>
              <NavLink end={"end" in item ? item.end : false} to={path ? `${adminBase}/${path}` : adminBase} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${isActive ? "bg-amber-50 text-amber-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}>
                <Icon size={17} /> {label}
              </NavLink>
              {path === "site" && siteActive ? (
                <nav className="mb-1 ml-8 mt-1 grid gap-0.5 border-l border-slate-200 pl-3" aria-label="Seções do site público">
                  <SiteSubLink to={`${adminBase}/site/pagina-inicial`} label="Página inicial" />
                  <SiteSubLink to={`${adminBase}/site/destaques`} label="Destaques" />
                  <SiteSubLink to={`${adminBase}/site/canais`} label="Canais oficiais" />
                </nav>
              ) : null}
            </div>
          ))}
        </nav>
        <Link to={`/${tenantSlug}`} className="mt-auto flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"><ExternalLink size={16} /> Ver site público</Link>
      </aside>

      <div className="min-w-0">
        <header className={`${calendarActive ? "hidden" : "sticky top-0 z-40 flex"} min-h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-xl md:hidden`}>
          <div className="min-w-0">
            <p className="m-0 text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-amber-700">{siteActive ? "Site público" : "Paroquial admin"}</p>
            <strong className="mt-0.5 block truncate text-base leading-tight text-slate-950">{currentTitle}</strong>
          </div>
          <Link to={`/${tenantSlug}`} aria-label="Ver site público" className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 transition active:scale-95"><ExternalLink size={17} /></Link>
        </header>

        <main className="m-0 max-w-none p-0 pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:pb-0"><Outlet /></main>

        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-xl md:hidden" aria-label="Navegação administrativa principal">
          <div className="mx-auto grid h-16 max-w-md grid-cols-4 px-2">
            {bottomItems.map(({ label, path, icon: Icon, ...item }) => {
              const destination = path ? `${adminBase}/${path}` : adminBase;
              if (label === "Mais") return <Link key={label} to={destination} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[0.68rem] font-semibold ${moreActive ? "text-amber-800" : "text-slate-400"}`}><Icon size={20} strokeWidth={moreActive ? 2.5 : 2} /><span>{label}</span></Link>;
              return <NavLink key={label} end={"end" in item ? item.end : false} to={destination} className={({ isActive }) => `flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[0.68rem] font-semibold ${isActive ? "text-amber-800" : "text-slate-400"}`}><Icon size={20} /><span>{label}</span></NavLink>;
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

function SiteSubLink({ to, label }: { to: string; label: string }) {
  return <NavLink to={to} className={({ isActive }) => `flex min-h-9 items-center text-xs font-semibold transition ${isActive ? "text-amber-800" : "text-slate-500 hover:text-slate-950"}`}>{label}</NavLink>;
}
