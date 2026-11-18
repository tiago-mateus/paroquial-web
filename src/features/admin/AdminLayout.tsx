import { useState } from 'react';
import { logoutLaunch } from '../auth/auth.api';
import { launchMode } from '../../shared/launchMode';
import { Outlet, useParams } from 'react-router-dom';
import { AppToaster } from '../../shared/components/AppToaster';
import { BottomNavigation } from '../../shared/components/BottomNavigation';
import { adminNavigation } from './adminNavigation';
import { SubscriptionBanner } from '../subscription/SubscriptionBanner';
import { AdminDesktopNavigation } from './AdminDesktopNavigation';
import { useApplyParishTheme } from '../../shared/theme/parishTheme';

export function AdminLayout() {
  const { tenantSlug = '' } = useParams();
  useApplyParishTheme(tenantSlug);
  const base = `/${tenantSlug}/admin`;
  return <>
    <div className="admin-workspace min-h-dvh min-w-0 bg-canvas text-ink lg:pl-[var(--admin-sidebar-width)]">
      <AdminDesktopNavigation />
      {launchMode ? <LaunchAdminNotice /> : <SubscriptionBanner />}
      <main id="admin-main" tabIndex={-1} className="@container/admin m-0 min-w-0 max-w-none p-0 pb-[var(--admin-nav-offset)] focus:outline-none"><Outlet /></main>
      <div className="lg:hidden"><BottomNavigation variant="public" label="Navegação principal" items={adminNavigation.map(({label,path,icon}) => ({label,icon,href:path ? `${base}/${path}` : base,end:!path}))} /></div>
    </div>
    <AppToaster />
  </>;
}

function LaunchAdminNotice() {
  const [status, setStatus] = useState<"idle" | "pending" | "error">("idle");

  async function logout() {
    setStatus("pending");
    try {
      await logoutLaunch();
      window.location.replace("/login");
    } catch {
      setStatus("error");
    }
  }

  return <div className="border-b border-line">
    <div className="mx-auto flex max-w-316 flex-wrap items-center justify-between gap-x-3 px-4 py-1 text-sm md:px-6 xl:px-8">
      <p className="my-2 text-muted">Eventos e conteúdos de demonstração são temporários.</p>
      <button type="button" disabled={status === "pending"} onClick={() => void logout()} className="min-h-11 rounded-lg px-2 font-semibold text-primary hover:bg-selection">{status === "pending" ? "Saindo…" : "Sair"}</button>
      {status === "error" ? <p role="alert" className="m-0 w-full pb-2 text-danger">Não foi possível sair. Tente novamente.</p> : null}
    </div>
  </div>;
}
