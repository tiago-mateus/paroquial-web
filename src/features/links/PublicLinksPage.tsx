import { useQuery } from "@tanstack/react-query";
import { ExternalLink, RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { getTenantLinks } from "../../shared/api/links";
import { getTenant } from "../../shared/api/tenants";
import { getBrazilianWhatsappHref } from "../../shared/lib/phone";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/PageState";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";
import { HomeHeader } from "../home/HomeHeader";
import { PublicLinkCard } from "./PublicLinkCard";
import { normalizeLinkUrl } from "./linkPresentation";

export function PublicLinksPage() {
  const { tenantSlug = "" } = useParams();
  const tenantQuery = useQuery({ queryKey: ["tenant", tenantSlug], queryFn: () => getTenant(tenantSlug), enabled: Boolean(tenantSlug) });
  const linksQuery = useQuery({ queryKey: ["links", tenantSlug], queryFn: () => getTenantLinks(tenantSlug), enabled: Boolean(tenantSlug) && tenantQuery.isSuccess });

  const links = useMemo(() => (linksQuery.data ?? [])
    .filter((link) => link.isActive !== false && link.title.trim() && normalizeLinkUrl(link.url))
    .sort((first, second) => first.order - second.order), [linksQuery.data]);
  useDocumentTitle("Links", tenantQuery.data?.name);

  if (tenantQuery.isLoading) return <LinksPageSkeleton />;
  if (tenantQuery.isError || !tenantQuery.data) {
    return <main className="grid min-h-dvh max-w-none place-items-center bg-stone-50 p-6"><ErrorState title="Paróquia não encontrada" description="Confira o endereço acessado ou tente novamente." /></main>;
  }

  const tenant = tenantQuery.data;
  const homeHref = `/${tenantSlug}`;
  const linksHref = `${homeHref}/links`;
  const agendaHref = `${homeHref}/calendario`;
  const churchesHref = `${homeHref}/igrejas`;
  const cityLabel = [tenant.cidade, tenant.estado].filter(Boolean).join(" · ");
  const contactHref = getBrazilianWhatsappHref(tenant.telefone);

  return (
    <main className="min-h-dvh max-w-none bg-slate-50 p-0 text-slate-950">
      <HomeHeader
        tenantName={tenant.name}
        cidade={cityLabel}
        headerConfig={tenant.homeHeader}
        homeActions={tenant.homeActions}
        homeHref={homeHref}
        linksHref={linksHref}
        agendaHref={agendaHref}
        churchesHref={churchesHref}
        contactHref={contactHref}
        confessionSchedule={tenant.confessionSchedule}
        variant="compact"
        compactTitle="Canais oficiais"
        compactBadge={links.length ? `${links.length} ${links.length === 1 ? "link" : "links"}` : undefined}
      />

      <section className="relative z-[2] mx-auto -mt-7 max-w-3xl px-0 sm:px-4 md:-mt-6">
        <div className="min-h-[24rem] rounded-t-[2rem] bg-white px-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] pt-6 shadow-[0_-12px_34px_rgb(15_23_42/0.09)] sm:rounded-[2rem] sm:px-6 md:p-8 md:shadow-[0_16px_44px_rgb(15_23_42/0.07)]">
          <div>
            {linksQuery.isLoading ? (
              <LinksGridSkeleton />
            ) : linksQuery.isError ? (
              <ErrorState
                title="Não foi possível carregar os links"
                description="Tente novamente em instantes."
                action={<button type="button" onClick={() => linksQuery.refetch()} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white"><RefreshCw size={14} /> Tentar novamente</button>}
              />
            ) : links.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {links.map((link) => <PublicLinkCard key={link.id} link={link} tenantSlug={tenantSlug} />)}
              </div>
            ) : (
              <EmptyState icon={<ExternalLink size={20} />} title="Nenhum link disponível no momento." description="Os canais oficiais aparecerão aqui quando forem publicados pela paróquia." />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function LinksGridSkeleton() {
  return <div className="grid gap-4 md:grid-cols-2" aria-label="Carregando links">{[0, 1, 2, 3].map((item) => <div key={item} className="h-[5.25rem] animate-pulse rounded-2xl border border-slate-100 bg-slate-50" />)}<span className="sr-only" role="status">Carregando links...</span></div>;
}

function LinksPageSkeleton() {
  return <main className="min-h-dvh max-w-none bg-slate-50 p-0"><div className="min-h-[18rem] animate-pulse bg-slate-800 md:min-h-[24rem]" /><section className="relative z-[2] mx-auto -mt-7 max-w-3xl sm:px-4"><div className="min-h-80 rounded-t-[2rem] bg-white p-6 sm:rounded-[2rem]"><LoadingState title="Preparando os canais..." /></div></section></main>;
}
