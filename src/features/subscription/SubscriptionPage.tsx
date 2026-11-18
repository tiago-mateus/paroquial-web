import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { money, plans } from "../marketing/offer";
import { PlanBenefits } from "../marketing/PlanBenefits";
import { createBillingPortal, getSubscription, subscriptionError, type Subscription } from "./subscription.api";

function statusCopy(data: Subscription) {
  if (data.status === "past_due") return { urgent: true, badge: "Pagamento pendente", badgeClass: "bg-danger/10 text-danger", dateLabel: "Vencimento", action: "Regularizar pagamento", message: "O último pagamento não foi aprovado. Atualize a forma de pagamento para manter o site e o painel funcionando." };
  if (data.status === "canceled") return { urgent: true, badge: "Encerrada", badgeClass: "bg-canvas text-muted", dateLabel: "Encerrada em", action: "Abrir portal de pagamento", message: "A assinatura foi encerrada. Os dados da paróquia continuam guardados." };
  if (data.cancelAtPeriodEnd) return { urgent: false, badge: "Cancelamento agendado", badgeClass: "bg-warning/10 text-warning", dateLabel: "Acesso até", action: "Manter assinatura", message: "O acesso continua até o fim do período pago. Se mudar de ideia, mantenha a assinatura no portal de pagamento." };
  return { urgent: false, badge: "Ativa", badgeClass: "bg-success/10 text-success", dateLabel: "Próxima cobrança", action: "Gerenciar assinatura", message: "" };
}
import { Failure, primaryClass } from "./SubscriptionShell";
import { AdminPageHeader } from "../admin/AdminPageHeader";
import { AdminPageContent } from "../admin/AdminPage";

export function SubscriptionPage() {
  const { tenantSlug = "" } = useParams();
  const query = useQuery({ queryKey: ["subscription", tenantSlug], queryFn: () => getSubscription(tenantSlug), retry: false });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  async function openPortal() {
    if (inFlight.current) return;
    inFlight.current = true; setPending(true); setError("");
    try { window.location.assign(await createBillingPortal(tenantSlug)); }
    catch (failure) { setError(subscriptionError(failure)); }
    finally { inFlight.current = false; setPending(false); }
  }
  const data = query.data;
  const plan = plans.find((item) => item.id === data?.planId);
  const status = data ? statusCopy(data) : undefined;
  return <><AdminPageHeader title="Minha assinatura" description="Consulte seu plano e gerencie os pagamentos." /><AdminPageContent width="narrow">
    {query.isPending ? <p role="status">Carregando assinatura…</p> : query.isError ? <><Failure message="Não foi possível consultar a assinatura desta paróquia." /><button className={primaryClass} onClick={() => void query.refetch()}>Tentar novamente</button></> : data && plan && status ? <>
      {data.demo ? <p className="mt-0 text-sm leading-6 text-muted">Assinatura de demonstração. Nenhuma cobrança real.</p> : null}
      <div className="rounded-2xl border border-line bg-surface">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0"><h2 className="m-0 font-display text-3xl font-medium">Plano {plan.name}</h2><p className="mb-0 mt-2 text-base leading-6 text-muted">{plan.description}</p></div>
            <span className={`inline-flex min-h-8 items-center rounded-full px-3 text-[13px] font-bold ${status.badgeClass}`}>{status.badge}</span>
          </div>
          <p className="mb-0 mt-4 text-3xl font-extrabold tabular-nums">{money(data.price.amount / 100)}<span className="text-base font-normal text-muted"> /mês</span></p>
          <p className="mb-0 mt-1 text-sm leading-6 text-muted">{status.dateLabel}: <strong className="font-semibold text-ink">{new Date(data.currentPeriodEnd).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</strong></p>
          {status.message ? <p className={`mb-0 mt-4 rounded-xl px-4 py-3 text-[15px] leading-6 ${status.urgent ? "bg-danger/10 text-danger" : "bg-selection/60 text-ink"}`}>{status.message}</p> : null}
        </div>
        <div className="border-t border-line p-5 sm:p-6">
          <h3 className="m-0 text-sm font-bold">Incluído no seu plano</h3>
          <div className="mt-4"><PlanBenefits plan={plan} columns /></div>
        </div>
        <div className="border-t border-line p-5 sm:p-6">
          {data.canManage ? <>
            <button className={`${primaryClass} w-full sm:w-auto`} type="button" disabled={pending} onClick={() => void openPortal()}>{pending ? "Abrindo…" : status.action}<ExternalLink size={16} aria-hidden="true" /></button>
            <p className="mb-0 mt-3 text-sm leading-6 text-muted">No portal de pagamento você troca de plano ou forma de pagamento, baixa as faturas e cancela quando quiser.</p>
          </> : <p className="m-0 text-sm leading-6 text-muted">Somente quem contratou a assinatura pode alterá-la. Peça a essa pessoa para entrar no Paroquial com o próprio e-mail e acessar esta página.</p>}
          <Failure message={error} />
        </div>
      </div>
    </> : null}
    <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
      <Link to={`/${tenantSlug}/admin`} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary">Voltar ao início</Link>
      {data && plan && status ? <Link to="/#planos" target="_blank" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary">Comparar os planos<ExternalLink size={14} aria-hidden="true" /><span className="sr-only"> (abre em nova aba)</span></Link> : null}
    </div>
  </AdminPageContent></>;
}
