import { launchMode } from "../../shared/launchMode";
import { useQuery } from "@tanstack/react-query";
import { CalendarPlus, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { getTenantChurches } from "../../shared/api/churches";
import { getAdminTenantEvents } from "../../shared/api/events";
import { getTenant } from "../../shared/api/tenants";
import { shiftDateKey, wallClockNow, wallDateKey } from "../../shared/lib/parishTime";
import { buttonClasses } from "../../shared/styles/controls";
import { useNow } from "../events/useNow";
import { AdminPage, AdminPageContent } from "./AdminPage";
import { AdminPageHeader } from "./AdminPageHeader";
import { buildAgendaOverview } from "./dashboard/agendaOverview";
import { buildParishStatus } from "./dashboard/parishStatus";
import { SiteStatusCard } from "./dashboard/SiteStatusCard";
import { TodayAgenda } from "./dashboard/TodayAgenda";

/** Janela de consulta de eventos: de ontem (para eventos que atravessam a meia-noite) até hoje + 14 dias. Sempre limitada. */
const UPCOMING_DAYS = 14;

/**
 * Painel: central operacional da paróquia.
 * Região principal: o que acontece hoje e o próximo compromisso. Região lateral: o que ainda pede ação.
 * Datas e estados dos eventos seguem a hora de parede da paróquia (ver shared/lib/parishTime), não o fuso do navegador.
 */
export function AdminDashboardPage() {
  const { tenantSlug = "" } = useParams();
  const base = `/${tenantSlug}/admin`;
  const now = useNow();
  const wallNowMs = wallClockNow(now);
  const todayKey = wallDateKey(wallNowMs);
  const rangeStart = shiftDateKey(todayKey, -1);
  const rangeEnd = shiftDateKey(todayKey, UPCOMING_DAYS);

  const tenantQuery = useQuery({ queryKey: ["tenant", tenantSlug], queryFn: () => getTenant(tenantSlug), enabled: Boolean(tenantSlug) });
  const eventsQuery = useQuery({ queryKey: ["admin", "events", tenantSlug, rangeStart, rangeEnd], queryFn: () => getAdminTenantEvents(tenantSlug, rangeStart, rangeEnd), enabled: Boolean(tenantSlug) });
  const churchesQuery = useQuery({ queryKey: ["churches", tenantSlug], queryFn: () => getTenantChurches(tenantSlug), enabled: Boolean(tenantSlug), retry: false });

  const overview = useMemo(() => buildAgendaOverview(eventsQuery.data ?? [], wallNowMs), [eventsQuery.data, wallNowMs]);
  const status = useMemo(
    () => buildParishStatus({ base, todayKey, tenant: tenantQuery.data, churches: churchesQuery.data, events: eventsQuery.data, windowDays: UPCOMING_DAYS }),
    [base, todayKey, tenantQuery.data, churchesQuery.data, eventsQuery.data],
  );
  const statusLoading = tenantQuery.isLoading || eventsQuery.isLoading || churchesQuery.isLoading;
  const statusError = tenantQuery.isError || eventsQuery.isError || churchesQuery.isError;
  const agendaHref = `${base}/calendario?date=${todayKey}`;
  const newEventHref = `${agendaHref}&action=new`;
  const retryStatus = () => { void tenantQuery.refetch(); void eventsQuery.refetch(); void churchesQuery.refetch(); };

  return <AdminPage header={<AdminPageHeader
    title="Painel"
    description={tenantQuery.isLoading ? "Carregando paróquia…" : tenantQuery.data?.name ?? "Sua paróquia"}
    publicHref={`/${tenantSlug}`}
    primaryAction={{ kind: "create", label: "Novo evento", icon: CalendarPlus, href: newEventHref }}
    secondaryAction={{ label: "Novo destaque", icon: Sparkles, href: `${base}/site/destaques?action=new` }}
  />}>
    <AdminPageContent width="wide">
      <div className="grid min-w-0 items-start gap-6 @4xl/admin:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] @4xl/admin:gap-10">
        <TodayAgenda
          overview={overview}
          wallNowMs={wallNowMs}
          loading={eventsQuery.isLoading}
          error={eventsQuery.isError}
          onRetry={() => void eventsQuery.refetch()}
          agendaHref={agendaHref}
          base={base}
          upcomingDays={UPCOMING_DAYS}
        />
        <SiteStatusCard status={status} loading={statusLoading} error={statusError} onRetry={retryStatus} base={base} />
      </div>
      {/* Em telas pequenas a barra inferior só tem os quatro grupos; estes dois destinos ficam aqui. No desktop estão na sidebar. */}
      <nav aria-label="Conta e primeiros passos" className="flex flex-wrap gap-x-1 border-t border-line/70 pt-2 lg:hidden">
        {!launchMode ? <Link to={`${base}/boas-vindas`} className={`${buttonClasses.ghost.md} -ml-4`}>Primeiros passos</Link> : null}
        {!launchMode ? <Link to={`${base}/assinatura`} className={buttonClasses.ghost.md}>Minha assinatura</Link> : null}
      </nav>
    </AdminPageContent>
  </AdminPage>;
}
