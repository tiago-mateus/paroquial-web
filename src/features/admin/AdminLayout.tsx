import { CalendarDays, ExternalLink, LayoutDashboard, ShieldCheck } from "lucide-react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";

export function AdminLayout() {
  const { tenantSlug = "" } = useParams();

  return (
    <div className="min-h-dvh min-w-0 max-w-full overflow-x-clip bg-stone-50 text-slate-950 md:grid md:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="hidden min-h-dvh flex-col border-r border-slate-800 bg-slate-950 px-4 py-5 text-white md:flex">
        <div className="flex items-center gap-3 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500 text-slate-950"><LayoutDashboard size={19} /></span>
          <div><strong className="block text-sm">Paroquial</strong><small className="text-xs text-slate-400">Painel administrativo</small></div>
        </div>
        <nav className="mt-8 grid gap-2" aria-label="Navegação administrativa">
          <NavLink to={`/${tenantSlug}/admin/calendario`} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${isActive ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
            <CalendarDays size={17} /> Agenda
          </NavLink>
        </nav>
        <Link to={`/${tenantSlug}`} className="mt-auto flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">
          <ExternalLink size={16} /> Ver site público
        </Link>
      </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl md:hidden">
          <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-100 text-amber-800"><ShieldCheck size={16} /></span><strong className="text-sm">Administração</strong></div>
          <Link to={`/${tenantSlug}`} className="rounded-lg px-2 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">Ver site</Link>
        </header>
        <main className="m-0 max-w-none p-0"><Outlet /></main>
      </div>
    </div>
  );
}
