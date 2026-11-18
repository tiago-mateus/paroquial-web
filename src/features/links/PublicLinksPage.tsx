import { useQuery } from "@tanstack/react-query";
import { ExternalLink, RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { getTenantLinks } from "../../shared/api/links";
import { usePublicChurches } from "../../shared/hooks/usePublicChurches";
import { usePublicTenant } from "../../shared/hooks/usePublicTenant";
import { resolveParishCover } from "../../shared/lib/parishCover";
import { PublicPageCover } from "../../shared/components/PublicPageCover";
import { EmptyState, ErrorState } from "../../shared/components/PageState";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";
import { PublicLinkCard } from "./PublicLinkCard";
import { normalizeLinkUrl } from "./linkPresentation";

export function PublicLinksPage() {
  const { tenantSlug = "" } = useParams();
  const tenantQuery = usePublicTenant(tenantSlug);
  const churchesQuery = usePublicChurches(tenantSlug, { enabled: tenantQuery.isSuccess && !tenantQuery.data.homeHeader?.imageUrl?.trim(), retry: false });
  const linksQuery = useQuery({ queryKey: ["links", tenantSlug], queryFn: () => getTenantLinks(tenantSlug), enabled: Boolean(tenantSlug) && tenantQuery.isSuccess });
  const links = useMemo(() => (linksQuery.data ?? [])
    .filter((link) => link.isActive !== false && link.title.trim() && normalizeLinkUrl(link.url))
    .sort((first, second) => first.order - second.order), [linksQuery.data]);
  useDocumentTitle("Links", tenantQuery.data?.name);

  if (tenantQuery.isLoading) return <LinksPageSkeleton />;
  if (tenantQuery.isError || !tenantQuery.data) {
    return <main className="grid min-h-[calc(100dvh-4.5rem)] max-w-none place-items-center bg-canvas p-6"><ErrorState title="Paróquia não encontrada" description="Confira o endereço acessado ou tente novamente." /></main>;
  }

  const coverImage = resolveParishCover({ headerConfig: tenantQuery.data.homeHeader, churches: churchesQuery.data });

  return (
    <main className="min-h-[calc(100dvh-4.5rem)] max-w-none bg-canvas p-0 pb-10 text-ink">
      <PublicPageCover
        title="Links | Canais Oficiais"
        titleId="public-links-heading"
        description={tenantQuery.data.name}
        cityLabel={[tenantQuery.data.cidade, tenantQuery.data.estado].filter(Boolean).join(" · ")}
        headerConfig={tenantQuery.data.homeHeader}
        fallbackImageUrl={coverImage}
      />
      <section className="mx-auto mt-5 max-w-4xl px-5 sm:mt-8 sm:px-6" aria-labelledby="public-links-heading">
        {linksQuery.isLoading ? (
          <LinksGridSkeleton />
        ) : linksQuery.isError ? (
          <ErrorState
            title="Não foi possível carregar os links"
            description="Tente novamente em instantes."
            action={<button type="button" onClick={() => linksQuery.refetch()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover"><RefreshCw aria-hidden="true" size={16} /> Tentar novamente</button>}
          />
        ) : links.length ? (
          <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2 md:gap-4">
            {links.map((link) => <li key={link.id} className="min-w-0"><PublicLinkCard link={link} tenantSlug={tenantSlug} /></li>)}
          </ul>
        ) : (
          <EmptyState icon={<ExternalLink size={20} />} title="Nenhum link disponível no momento." description="Os canais oficiais aparecerão aqui quando forem publicados pela paróquia." />
        )}
      </section>
    </main>
  );
}

function LinksGridSkeleton() {
  return <div className="grid gap-3 md:grid-cols-2 md:gap-4" aria-label="Carregando links" aria-busy="true">{[0, 1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl border border-line bg-surface motion-reduce:animate-none" />)}<span className="sr-only" role="status">Carregando links...</span></div>;
}

function LinksPageSkeleton() {
  return <main className="min-h-[calc(100dvh-4.5rem)] max-w-none bg-canvas p-0 pb-10"><div className="mx-auto max-w-6xl px-5 pt-4 sm:px-6 sm:pt-6" aria-hidden="true"><div className="mb-3 h-8 w-32 rounded-lg bg-selection motion-safe:animate-pulse sm:h-11" /><div className="h-56 rounded-2xl bg-selection motion-safe:animate-pulse sm:h-64" /></div><div className="mx-auto mt-5 max-w-4xl px-5 sm:mt-8 sm:px-6"><LinksGridSkeleton /></div></main>;
}
