import { useQuery } from "@tanstack/react-query";
import { Building2, CheckCircle2, ChevronRight, Image, Link2, Settings2, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { getTenantBanners } from "../../shared/api/banners";
import { getTenantChurches } from "../../shared/api/churches";
import { getAdminTenantLinks } from "../../shared/api/links";
import { getTenant } from "../../shared/api/tenants";
import { AdminPageHeader } from "./AdminPageHeader";
import { AdminPage, AdminPageContent, AdminSurface, AdminSurfaceHeader } from "./AdminPage";

export function AdminSettingsPage() {
  const { tenantSlug = "" } = useParams();
  const tenant = useQuery({ queryKey: ["tenant", tenantSlug], queryFn: () => getTenant(tenantSlug), enabled: Boolean(tenantSlug) });
  const churches = useQuery({ queryKey: ["churches", tenantSlug], queryFn: () => getTenantChurches(tenantSlug), enabled: Boolean(tenantSlug), retry: false });
  const links = useQuery({ queryKey: ["admin", "links", tenantSlug], queryFn: () => getAdminTenantLinks(tenantSlug), enabled: Boolean(tenantSlug), retry: false });
  const banners = useQuery({ queryKey: ["banners", tenantSlug], queryFn: () => getTenantBanners(tenantSlug), enabled: Boolean(tenantSlug), retry: false });
  const activeLinks = links.data?.filter((link) => link.isActive !== false).length ?? 0;

  return <AdminPage header={<AdminPageHeader title="Situação do site" description="Confira as informações disponíveis no site e acesse a área responsável." />}><AdminPageContent><AdminSurface labelledBy="publication-status-title"><AdminSurfaceHeader id="publication-status-title" title="Informações disponíveis" description="Dados que alimentam as telas públicas" /><StatusRow icon={<ShieldCheck size={18} />} label="Identidade da paróquia" value={tenant.isLoading ? "Verificando" : tenant.isError ? "Indisponível" : tenant.data?.name ?? "Indisponível"} href={`/${tenantSlug}/admin/paroquia/dados`} ready={!tenant.isLoading && !tenant.isError && Boolean(tenant.data?.name && (tenant.data.telefone || tenant.data.contato))} /><StatusRow icon={<Image size={18} />} label="Destaques da página inicial" value={banners.isLoading ? "Verificando" : banners.isError ? "Indisponível" : `${banners.data?.length ?? 0} publicados`} href={`/${tenantSlug}/admin/site/destaques`} ready={!banners.isLoading && !banners.isError && Boolean(banners.data?.length)} /><StatusRow icon={<Building2 size={18} />} label="Igrejas e capelas" value={churches.isLoading ? "Verificando" : churches.isError ? "Indisponível" : `${churches.data?.length ?? 0} locais`} href={`/${tenantSlug}/admin/paroquia/igrejas`} ready={!churches.isLoading && !churches.isError && Boolean(churches.data?.length)} /><StatusRow icon={<Link2 size={18} />} label="Canais oficiais" value={links.isLoading ? "Verificando" : links.isError ? "Indisponível" : `${activeLinks} ativos`} href={`/${tenantSlug}/admin/site/canais`} ready={!links.isLoading && !links.isError && activeLinks > 0} /></AdminSurface><AdminSurface className="border-t border-line/60 py-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-selection/50 text-muted"><Settings2 size={18} /></span><h2 className="m-0 mt-3 text-sm font-bold">Endereço público</h2><p className="m-0 mt-1 break-all text-sm text-muted">/{tenantSlug}</p><p className="m-0 mt-3 text-sm leading-5 text-muted">Este é o endereço da página pública da sua paróquia.</p></AdminSurface></AdminPageContent></AdminPage>;
}

function StatusRow({ icon, label, value, href, ready }: { icon: ReactNode; label: string; value: string; href: string; ready: boolean }) { return <Link to={href} className="flex min-h-[4.5rem] items-center gap-3 border-b border-line/60 px-0 py-4 hover:bg-selection/35 md:px-0"><span className={`grid h-10 w-10 place-items-center rounded-xl ${ready ? "bg-success/10 text-success" : "bg-canvas text-primary"}`}>{ready ? <CheckCircle2 size={18} /> : icon}</span><span className="min-w-0 flex-1"><strong className="block text-sm">{label}</strong><small className="mt-0.5 block break-words text-sm text-muted">{value}</small></span><ChevronRight size={16} className="text-muted" /></Link>; }
