import { AlertTriangle, LockKeyhole, MapPinOff, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

export function ChurchesLoadingState() {
  return <main className="min-h-dvh max-w-none bg-canvas px-5 pb-28 pt-6 text-ink sm:px-6 sm:pt-8"><div className="mx-auto max-w-6xl"><h1 className="m-0 text-[30px] font-extrabold text-primary sm:text-4xl">Igrejas</h1><div role="status" className="mt-7 grid gap-4"><span className="sr-only">Carregando igrejas…</span>{[0, 1, 2].map(item => <div key={item} aria-hidden="true" className="h-24 animate-pulse rounded-xl bg-selection motion-reduce:animate-none" />)}</div></div></main>;
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
