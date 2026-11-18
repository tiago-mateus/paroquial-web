import { CheckCircle2, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonClasses } from "../../../shared/styles/controls";
import { AdminSurface } from "../AdminPage";
import type { ParishStatus } from "./parishStatus";

type Props = {
  status: ParishStatus;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  base: string;
};

/**
 * Única região de situação do Painel. Reúne o que antes ficava em "Revisão do site", em "Primeiros passos"
 * e em "Situação do site". Essas páginas continuam existindo; aqui aparece só o que ainda pede ação.
 */
export function SiteStatusCard({ status, loading, error, onRetry, base }: Props) {
  const { items, progress } = status;
  const essentialsMissing = progress ? progress.done < progress.total : false;
  const summary = loading ? "Verificando informações…" : error ? "Verificação incompleta" : items.length ? `${items.length} ${items.length === 1 ? "item para revisar" : "itens para revisar"}` : "Tudo em dia";

  return <AdminSurface labelledBy="site-status-title" className="self-start">
    <div className="flex items-baseline justify-between gap-3">
      <h2 id="site-status-title" className="m-0 font-display text-xl font-medium leading-7 text-ink">Situação da paróquia</h2>
    </div>
    <p role="status" className="m-0 mt-0.5 text-sm leading-5 text-muted">{summary}</p>

    {essentialsMissing && progress ? <div className="mt-3">
      <div className="flex items-baseline justify-between gap-3 text-[13px] text-muted">
        <span>Informações essenciais</span>
        <span className="tabular-nums">{progress.done} de {progress.total}</span>
      </div>
      <div role="progressbar" aria-label="Informações essenciais configuradas" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done} className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-selection">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} />
      </div>
    </div> : null}

    {loading ? <div aria-hidden="true" className="mt-4 animate-pulse space-y-3 motion-reduce:animate-none"><span className="block h-4 w-3/4 rounded bg-selection" /><span className="block h-4 w-1/2 rounded bg-selection" /></div> : null}

    {!loading && error ? <div role="alert" className="mt-3">
      <p className="m-0 text-sm leading-6 text-muted">Não foi possível verificar todas as informações.</p>
      <button type="button" onClick={onRetry} className={`${buttonClasses.secondary.md} mt-2`}>Tentar novamente</button>
    </div> : null}

    {!loading && items.length ? <ul aria-label="Itens para revisar" className="m-0 mt-3 list-none divide-y divide-line/70 border-t border-line/70 p-0">
      {items.map((item) => {
        const Icon = item.icon;
        return <li key={item.id}>
          <Link to={item.href} className="group -mx-2 flex min-h-14 items-start gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-selection/40 motion-reduce:transition-none">
            <Icon size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-warning" />
            <span className="min-w-0 flex-1">
              <strong className="block text-[15px] font-semibold leading-5 text-ink [overflow-wrap:anywhere] group-hover:text-primary">{item.label}</strong>
              <span className="mt-0.5 block text-[13px] leading-5 text-muted">{item.description}</span>
            </span>
            <ChevronRight size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </Link>
        </li>;
      })}
    </ul> : null}

    {!loading && !error && !items.length ? <p className="m-0 mt-3 flex items-start gap-2 text-sm leading-6 text-ink"><CheckCircle2 size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-success" />Site configurado e publicado.</p> : null}

    <div className="mt-3 flex flex-wrap gap-x-1 border-t border-line/70 pt-2">
      <Link to={`${base}/site/status`} className={`${buttonClasses.ghost.sm} -ml-3`}>Situação do site<ChevronRight size={16} aria-hidden="true" /></Link>
      {/* Abaixo de lg o rodapé do Painel já oferece "Primeiros passos"; aqui só no desktop, onde a sidebar não o destaca. */}
      {essentialsMissing ? <Link to={`${base}/boas-vindas`} className={`${buttonClasses.ghost.sm} max-lg:hidden`}>Primeiros passos<ChevronRight size={16} aria-hidden="true" /></Link> : null}
    </div>
  </AdminSurface>;
}
