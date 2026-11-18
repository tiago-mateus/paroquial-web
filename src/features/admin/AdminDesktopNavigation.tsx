import { launchMode } from "../../shared/launchMode";
import { Church, CreditCard, ExternalLink, Sparkles } from 'lucide-react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { adminNavigation } from './adminNavigation';

/** Persistent desktop sidebar. The existing bottom navigation serves mobile. */
export function AdminDesktopNavigation() {
  const { tenantSlug = '' } = useParams();
  const base = `/${tenantSlug}/admin`;
  const linkStyle = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? 'bg-selection font-semibold text-primary' : 'text-muted hover:bg-selection/60 hover:text-ink'}`;

  return <aside aria-label="Menu administrativo" className="fixed inset-y-0 left-0 z-40 hidden w-[var(--admin-sidebar-width)] flex-col border-r border-line bg-surface lg:flex">
    <a href="#admin-main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-10 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-3 focus:text-white">Pular para o conteúdo</a>
    <div className="flex min-h-16 shrink-0 items-center border-b border-line px-6">
      <Link to={base} aria-label="Paroquial, painel administrativo" className="inline-flex min-h-11 items-center gap-2 text-xl font-bold tracking-tight text-primary"><Church size={25} aria-hidden="true" />paroquial.</Link>
    </div>
    <nav aria-label="Navegação administrativa desktop" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 [scrollbar-width:thin] xl:p-4">
      <ul className="m-0 grid list-none gap-3 p-0">
        {adminNavigation.map(({ label, path, icon: Icon, items }) => <li key={label}>
          <NavLink to={path ? `${base}/${path}` : base} end={!path} className={items.length ? ({ isActive }) => `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${isActive ? 'text-primary' : 'text-ink hover:bg-selection/60'}` : linkStyle}><Icon size={20} className="shrink-0" aria-hidden="true" />{label}</NavLink>
          {items.length ? <ul className="m-0 mt-0.5 ml-[1.375rem] grid list-none gap-0.5 border-l border-line p-0 pl-2">{items.map((item) => <li key={item.path}><NavLink to={`${base}/${item.path}`} end className={linkStyle}>{item.label}</NavLink></li>)}</ul> : null}
        </li>)}
      </ul>
      <div className="mt-4 grid gap-1 border-t border-line pt-3">
        {!launchMode ? <NavLink to={`${base}/boas-vindas`} className={linkStyle}><Sparkles size={20} className="shrink-0" aria-hidden="true" />Primeiros passos</NavLink> : null}
        {!launchMode ? <NavLink to={`${base}/assinatura`} className={linkStyle}><CreditCard size={20} className="shrink-0" aria-hidden="true" />Minha assinatura</NavLink> : null}
        <NavLink to={`${base}/site/status`} className={linkStyle}><ExternalLink size={20} className="shrink-0" aria-hidden="true" />Situação do site</NavLink>
      </div>
    </nav>
    <div className="shrink-0 border-t border-line p-3 xl:p-4"><Link to={`/${tenantSlug}`} className="inline-flex min-h-11 w-full items-center justify-between rounded-lg px-3 text-sm font-semibold text-primary hover:bg-selection">Ver site público<ExternalLink size={18} aria-hidden="true" /></Link></div>
  </aside>;
}
