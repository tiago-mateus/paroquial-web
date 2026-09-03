import { useQuery } from "@tanstack/react-query";
import { Building2, CheckCircle2, ChevronRight, ExternalLink, Image, Link2, Settings2, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { getTenantBanners } from "../../shared/api/banners";
import { getTenantChurches } from "../../shared/api/churches";
import { getAdminTenantLinks } from "../../shared/api/links";
import { getTenant } from "../../shared/api/tenants";
import { AdminPageHeader } from "./AdminPageHeader";

export function AdminSettingsPage() {
  const { tenantSlug = "" } = useParams();
  const tenant = useQuery({ queryKey: ["tenant", tenantSlug], queryFn: () => getTenant(tenantSlug), enabled: Boolean(tenantSlug) });
  const churches = useQuery({ queryKey: ["churches", tenantSlug], queryFn: () => getTenantChurches(tenantSlug), enabled: Boolean(tenantSlug), retry: false });
  const links = useQuery({ queryKey: ["admin", "links", tenantSlug], queryFn: () => getAdminTenantLinks(tenantSlug), enabled: Boolean(tenantSlug), retry: false });
  const banners = useQuery({ queryKey: ["banners", tenantSlug], queryFn: () => getTenantBanners(tenantSlug), enabled: Boolean(tenantSlug), retry: false });
  const activeLinks = links.data?.filter((link) => link.isActive !== false).length ?? 0;

  return <section className="min-h-[calc(100dvh-4rem)] bg-white text-slate-950 md:min-h-dvh md:bg-stone-50"><AdminPageHeader eyebrow="Publicação" title="Configurações" description="Confira a integridade da presença digital e acesse a área responsável por cada informação." actions={<Link to={`/${tenantSlug}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600"><ExternalLink size={15} /> Abrir site</Link>} /><div className="mx-auto max-w-5xl pb-4 md:px-6 md:py-6 lg:px-8"><section className="md:overflow-hidden md:rounded-2xl md:border md:border-slate-200 md:bg-white"><div className="px-4 pb-2 pt-4 md:px-5"><h2 className="m-0 text-sm font-bold">Status da publicação</h2><p className="m-0 mt-0.5 text-xs text-slate-500">Dados que alimentam as telas públicas</p></div><StatusRow icon={<ShieldCheck size={18} />} label="Identidade da paróquia" value={tenant.isLoading ? "Verificando" : tenant.data?.name ?? "Indisponível"} href={`/${tenantSlug}/admin/paroquia`} ready={Boolean(tenant.data?.name && tenant.data.telefone)} /><StatusRow icon={<Image size={18} />} label="Destaques da página inicial" value={banners.isLoading ? "Verificando" : `${banners.data?.length ?? 0} publicados`} href={`/${tenantSlug}/admin/site/destaques`} ready={Boolean(banners.data?.length)} /><StatusRow icon={<Building2 size={18} />} label="Igrejas e capelas" value={churches.isLoading ? "Verificando" : `${churches.data?.length ?? 0} locais`} href={`/${tenantSlug}/admin/igrejas`} ready={Boolean(churches.data?.length)} /><StatusRow icon={<Link2 size={18} />} label="Canais oficiais" value={links.isLoading ? "Verificando" : `${activeLinks} ativos`} href={`/${tenantSlug}/admin/site/canais`} ready={activeLinks > 0} /></section><section className="mt-4 px-4 py-5 md:rounded-2xl md:border md:border-slate-200 md:bg-white md:px-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600"><Settings2 size={18} /></span><h2 className="m-0 mt-3 text-sm font-bold">Endereço público</h2><p className="m-0 mt-1 break-all text-xs text-slate-500">/{tenantSlug}</p><p className="m-0 mt-3 text-xs leading-5 text-slate-500">Preferências técnicas e integrações serão exibidas aqui somente quando houver suporte correspondente no backend.</p></section></div></section>;
}

function StatusRow({ icon, label, value, href, ready }: { icon: ReactNode; label: string; value: string; href: string; ready: boolean }) { return <Link to={href} className="flex min-h-[4.5rem] items-center gap-3 border-t border-slate-100 px-4 py-3 hover:bg-stone-50 md:px-5"><span className={`grid h-10 w-10 place-items-center rounded-xl ${ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{ready ? <CheckCircle2 size={18} /> : icon}</span><span className="min-w-0 flex-1"><strong className="block text-sm">{label}</strong><small className="mt-0.5 block truncate text-xs text-slate-500">{value}</small></span><ChevronRight size={16} className="text-slate-300" /></Link>; }
