import { AlertTriangle, LockKeyhole, MapPinOff, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { SkeletonShape, SkeletonStatus } from "../../shared/components/PublicSkeleton";

export function ChurchesLoadingState() {
  return (
    <main className="relative isolate h-[calc(100dvh-4.5rem-env(safe-area-inset-bottom,0px))] max-w-none overflow-hidden bg-neutral-100 p-0">
      <h1 className="sr-only">Igrejas</h1>
      <SkeletonStatus label="Carregando igrejas…">
        <div className="absolute left-3 right-16 top-3 flex min-h-11 items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 sm:left-5 sm:right-auto sm:w-96">
          <SkeletonShape className="size-4 rounded-full" />
          <SkeletonShape className="h-3.5 w-28 rounded" />
        </div>
        <div className="absolute right-3 top-3 grid size-11 place-items-center rounded-xl border border-neutral-200 bg-neutral-50 sm:right-5">
          <SkeletonShape className="size-4 rounded" />
        </div>
        <div className="absolute bottom-7 left-3 right-3 rounded-xl border border-neutral-200 bg-neutral-50 sm:left-5 sm:right-auto sm:w-96">
          <div className="px-4 pb-2 pt-3">
            <SkeletonShape className="h-6 w-4/5 max-w-56 rounded-md" />
            <SkeletonShape className="mt-2 h-3.5 w-2/3 max-w-48 rounded" />
            <div className="mt-3 flex h-11 items-center gap-3">
              <SkeletonShape className="h-9 w-24 rounded-lg" />
              <SkeletonShape className="h-3.5 w-20 rounded" />
            </div>
          </div>
          <div className="mx-3 flex min-h-13 items-center gap-3 border-t border-neutral-200 px-1">
            <SkeletonShape className="mr-auto h-3.5 w-24 rounded" />
            <SkeletonShape className="size-4 rounded" />
            <SkeletonShape className="h-3.5 w-6 rounded" />
            <SkeletonShape className="size-4 rounded" />
          </div>
        </div>
      </SkeletonStatus>
    </main>
  );
}
export function ChurchesErrorState({ onRetry }: { onRetry: () => void }) {
  return <StateFrame icon={<AlertTriangle size={22} />} title="Erro ao carregar igrejas" description="Verifique sua conexão e tente novamente."><button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-hover"><RefreshCw size={16} aria-hidden="true" />Tentar novamente</button></StateFrame>;
}
export function ChurchesEmptyState() {
  return <StateFrame icon={<MapPinOff size={22} />} title="Nenhuma igreja cadastrada" description="Igrejas e capelas aparecerão aqui assim que forem cadastradas." />;
}
export function ChurchesBlockedState({ tenantSlug }: { tenantSlug: string }) {
  return <StateFrame icon={<LockKeyhole size={22} />} title="Mapa de igrejas indisponível" description="Esta paróquia ainda não ativou o localizador público de igrejas e capelas."><div className="flex flex-wrap justify-center gap-3"><Link to={`/${tenantSlug}`} className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-hover">Início</Link><Link to={`/${tenantSlug}/links`} className="inline-flex min-h-11 items-center rounded-xl bg-selection px-5 py-2 text-sm font-bold text-primary hover:bg-line">Links</Link></div></StateFrame>;
}
function StateFrame({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children?: React.ReactNode }) {
  return <main className="min-h-dvh max-w-none bg-canvas px-5 pb-28 pt-6 text-ink sm:px-6 sm:pt-8"><div className="mx-auto max-w-6xl"><h1 className="m-0 text-[30px] font-extrabold text-primary sm:text-4xl">Igrejas</h1><section className="mt-7 max-w-lg rounded-xl border border-line bg-surface px-5 py-8 text-center"><span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-selection text-primary">{icon}</span><h2 className="mb-0 mt-4 text-xl font-bold text-primary">{title}</h2><p className="mb-0 mt-3 text-base leading-6 text-muted">{description}</p>{children ? <div className="mt-5 flex justify-center">{children}</div> : null}</section></div></main>;
}
