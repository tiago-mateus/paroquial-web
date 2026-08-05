import { AlertTriangle, Church, LockKeyhole, MapPinOff, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

export function ChurchesLoadingState() {
  return <main className="fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom,0px))] top-0 overflow-hidden bg-slate-200 md:bottom-0"><div className="absolute inset-0 animate-pulse bg-[linear-gradient(135deg,#e2e8f0,#f8fafc,#cbd5e1)]" /><div className="absolute left-3 top-3 h-10 w-48 animate-pulse rounded-full bg-white/80" /><div className="absolute bottom-3 left-3 right-3 h-44 animate-pulse rounded-[1.75rem] bg-white/90 md:bottom-4 md:left-auto md:top-4 md:h-auto md:w-80" /></main>;
}

export function ChurchesErrorState({ onRetry }: { onRetry: () => void }) {
  return <StateFrame icon={<AlertTriangle size={22} />} label="Não foi possível abrir o mapa" title="Erro ao carregar igrejas" description="Verifique sua conexão e tente novamente."><button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-slate-950 px-5 py-2 text-sm font-bold text-white"><RefreshCw size={15} /> Tentar novamente</button></StateFrame>;
}

export function ChurchesEmptyState() {
  return <StateFrame icon={<MapPinOff size={22} />} label="Aguardando dados da paróquia" title="Nenhuma igreja cadastrada" description="Igrejas e capelas aparecerão aqui assim que forem cadastradas." />;
}

export function ChurchesBlockedState({ tenantSlug }: { tenantSlug: string }) {
  return <StateFrame icon={<LockKeyhole size={22} />} label="Recurso premium" title="Mapa de igrejas indisponível" description="Esta paróquia ainda não ativou o localizador público de igrejas e capelas."><div className="flex gap-2"><Link to={`/${tenantSlug}`} className="inline-flex min-h-11 items-center rounded-full bg-slate-950 px-5 py-2 text-sm font-bold text-white">Início</Link><Link to={`/${tenantSlug}/links`} className="inline-flex min-h-11 items-center rounded-full bg-slate-100 px-5 py-2 text-sm font-bold text-slate-700">Links</Link></div></StateFrame>;
}

function StateFrame({ icon, label, title, description, children }: { icon: React.ReactNode; label: string; title: string; description: string; children?: React.ReactNode }) {
  return (
    <main className="grid min-h-[calc(100dvh-76px)] max-w-none place-items-center bg-stone-50 px-5 py-10 md:min-h-dvh">
      <section className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-7 text-center shadow-[0_24px_70px_rgb(15_23_42/0.08)]">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-800">{icon}</span>
        <p className="mb-2 mt-5 text-[0.65rem] font-extrabold uppercase tracking-[0.16em] text-amber-700">{label}</p>
        <h1 className="m-0 text-xl font-bold text-slate-950">{title}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
        {children ? <div className="mt-6 flex justify-center">{children}</div> : <Church className="mx-auto mt-6 text-slate-200" size={24} />}
      </section>
    </main>
  );
}
