import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../shared/api/http";
import { money, plans } from "../marketing/offer";
import { getOnboarding, subscriptionError } from "./subscription.api";
import { Failure, outlineClass, primaryClass, secondaryClass, SubscriptionShell, surfaceCardClass, tintedCardClass } from "./SubscriptionShell";

const bigButton = `${primaryClass} min-h-14 w-full rounded-2xl text-lg`;

export default function DemoCheckoutPage() {
  const [params] = useSearchParams();
  const portal = params.get("portal") === "1";
  const query = useQuery({ queryKey: ["onboarding"], queryFn: getOnboarding, retry: false, staleTime: 0 });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const inFlight = useRef(false);
  const navigate = useNavigate();
  const client = useQueryClient();
  if (!import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCKS !== "true") return <Navigate to="/" replace />;
  const registration = query.data?.registration;
  const plan = plans.find((item) => item.id === registration?.planId);
  async function simulate(result: string) {
    if (inFlight.current) return;
    inFlight.current = true; setPending(true); setError("");
    try {
      await apiFetch("/api/v1/__demo/payment", { method: "POST", body: JSON.stringify({ result }) });
      await client.invalidateQueries({ queryKey: ["onboarding"] });
      await client.invalidateQueries({ queryKey: ["subscription"] });
      navigate(portal ? `/${query.data?.tenantSlug}/admin/assinatura` : "/assinatura/confirmacao", { replace: true });
    } catch (failure) { setError(subscriptionError(failure)); }
    finally { inFlight.current = false; setPending(false); }
  }
  return <SubscriptionShell signedIn={Boolean(query.data?.user)}><section className="max-w-xl pb-6">
    <p className="m-0 mb-4 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-[13px] font-bold text-accent-ink"><FlaskConical size={15} aria-hidden="true" />Simulação · nenhuma cobrança real</p>
    <h1 className="m-0 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{portal ? "Portal de demonstração" : "Simulador de pagamento"}</h1>
    <p className="mb-6 mt-3 text-base leading-7 text-muted">{portal ? "Na versão real, esta etapa abre o portal de assinatura do provedor de pagamento." : "Esta tela representa o ambiente de pagamento externo. Ela não realiza cobranças."} Não informe dados de cartão.</p>
    {plan && registration ? <div className={`${surfaceCardClass} mb-6 p-4 sm:p-5`}>
      <p className="m-0 text-sm text-muted">Paroquial · Plano {plan.name}{registration.parish ? ` · ${registration.parish.name}` : ""}</p>
      <p className="mb-0 mt-1 text-3xl font-extrabold tabular-nums">{money(registration.price.amount / 100)}<span className="text-base font-medium text-muted"> /mês</span></p>
    </div> : null}
    <Failure message={error} />
    {query.isError ? <button className={outlineClass} onClick={() => void query.refetch()}>Recarregar contratação</button> : !registration ? <Link to="/assinar" className={bigButton}>Iniciar uma contratação</Link> : portal ? <>
      <p className="text-sm leading-6 text-muted">A simulação permite testar o cancelamento ao final do período, mantendo o acesso atual.</p>
      {confirmCancel ? <div role="alertdialog" aria-labelledby="demo-cancel-title" aria-describedby="demo-cancel-description" className={`${tintedCardClass} p-4`}><h2 id="demo-cancel-title" className="m-0 text-lg font-bold">Agendar cancelamento?</h2><p id="demo-cancel-description" className="text-base leading-7 text-muted">A assinatura de demonstração deixará de renovar. O período atual continua disponível.</p><div className="grid gap-2 sm:grid-cols-2"><button autoFocus disabled={pending} type="button" className={outlineClass} onClick={() => setConfirmCancel(false)}>Manter assinatura</button><button disabled={pending} type="button" className={primaryClass} onClick={() => void simulate("cancel_at_period_end")}>Confirmar cancelamento</button></div></div> : <button type="button" className={`${outlineClass} w-full`} onClick={() => setConfirmCancel(true)}>Cancelar assinatura de demonstração</button>}
      <Link to={`/${query.data!.tenantSlug}/admin/assinatura`} className={`${secondaryClass} mt-3 px-0`}><ArrowLeft size={16} aria-hidden="true" />Voltar à assinatura</Link>
    </> : <>
      <button disabled={pending} type="button" className={bigButton} onClick={() => void simulate("paid")}>Simular pagamento aprovado</button>
      <fieldset disabled={pending} className={`${tintedCardClass} mt-4 border-0 p-4`}>
        <legend className="float-left mb-3 p-0 text-sm font-bold">Testar outros resultados</legend>
        <div className="clear-both grid gap-2 sm:grid-cols-3">
          <button type="button" className={outlineClass} onClick={() => void simulate("pending")}>Pendente</button>
          <button type="button" className={outlineClass} onClick={() => void simulate("failed")}>Recusado</button>
          <button type="button" className={outlineClass} onClick={() => void simulate("expired")}>Sessão expirada</button>
        </div>
      </fieldset>
      <Link to="/assinar" className={`${secondaryClass} mt-4 px-0`}><ArrowLeft size={16} aria-hidden="true" />Voltar sem pagar</Link>
    </>}
  </section></SubscriptionShell>;
}
