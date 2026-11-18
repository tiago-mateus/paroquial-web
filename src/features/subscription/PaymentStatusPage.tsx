import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Church, Clock3, LoaderCircle, PartyPopper, RefreshCw, TriangleAlert } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { getOnboarding, type Onboarding } from "./subscription.api";
import { Failure, iconTileClass, outlineClass, primaryClass, secondaryClass, SubscriptionShell, surfaceCardClass } from "./SubscriptionShell";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";
import { stateLabel } from "./signupFormat";

const bigButton = `${primaryClass} min-h-14 w-full rounded-2xl text-lg`;

type Phase = "waiting" | "preparing" | "active";
const progressSteps = ["Pagamento enviado", "Pagamento confirmado", "Preparando seu espaço", "Acesso liberado"];
const progressIndex: Record<Phase, number> = { waiting: 1, preparing: 2, active: 4 };

/** Shows where the payment is, so waiting never looks like something went wrong. */
function PaymentProgress({ phase }: { phase: Phase }) {
  const current = progressIndex[phase];
  return <ol aria-label="Andamento da contratação" className={`${surfaceCardClass} m-0 mb-5 grid list-none gap-0 p-4 sm:p-5`}>
    {progressSteps.map((label, index) => {
      const done = index < current;
      const active = index === current;
      return <li key={label} aria-current={active ? "step" : undefined} className="relative flex items-center gap-3 py-2">
        {index < progressSteps.length - 1 ? <span aria-hidden="true" className={`absolute left-3.5 top-[2.1rem] h-[calc(100%-1.6rem)] w-0.5 -translate-x-1/2 ${done ? "bg-primary" : "bg-line"}`} /> : null}
        <span aria-hidden="true" className={`relative z-10 grid size-7 shrink-0 place-items-center rounded-full ${done ? "bg-primary text-white" : active ? "bg-selection text-primary ring-2 ring-primary" : "bg-[#e3e9f3] text-muted"}`}>{done ? <Check size={15} strokeWidth={3} /> : active ? <LoaderCircle size={15} className="animate-spin motion-reduce:animate-none" /> : null}</span>
        <span className={`text-[15px] ${done ? "font-semibold text-ink" : active ? "font-bold text-primary" : "text-muted"}`}>{label}<span className="sr-only">{done ? " (concluído)" : active ? " (em andamento)" : " (próximo)"}</span></span>
      </li>;
    })}
  </ol>;
}

function ParishSummary({ data }: { data: Onboarding }) {
  const parish = data.registration?.parish;
  if (!parish) return null;
  return <div className={`${surfaceCardClass} mb-6 flex items-start gap-3 p-4`}>
    <span className={`${iconTileClass} size-11`}><Church size={22} aria-hidden="true" /></span>
    <p className="m-0 min-w-0 text-[15px] leading-6"><strong className="block font-bold">{parish.name}</strong><span className="block text-sm text-muted">{parish.city} · {stateLabel(parish.state)}</span></p>
  </div>;
}

export function PaymentStatusPage() {
  useDocumentTitle("Sua assinatura", "Paroquial");
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["onboarding"], queryFn: getOnboarding, retry: false, staleTime: 0, refetchInterval: (current) => ["payment_pending", "provisioning"].includes(current.state.data?.status ?? "") ? 3000 : false });
  const data = query.data;
  if (data?.status === "account" || data?.status === "verify_email" || data?.status === "parish") return <Navigate to="/assinar" replace />;
  const active = data?.status === "active" && data.tenantSlug;
  const preparing = data?.status === "provisioning";
  const waiting = data?.status === "payment_pending";
  const problem = data?.status === "payment_failed" || data?.status === "checkout_expired";
  const phase: Phase | null = active ? "active" : preparing ? "preparing" : waiting ? "waiting" : null;
  const icon = active ? <PartyPopper size={30} strokeWidth={1.8} aria-hidden="true" /> : preparing ? <LoaderCircle size={30} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : waiting ? <Clock3 size={30} strokeWidth={1.8} aria-hidden="true" /> : problem ? <TriangleAlert size={30} strokeWidth={1.8} aria-hidden="true" /> : <RefreshCw size={30} strokeWidth={1.8} aria-hidden="true" />;
  const tone = active ? "bg-emerald-50 text-emerald-700" : problem || waiting ? "bg-amber-50 text-amber-700" : "bg-selection text-primary";
  const title = active ? "Tudo pronto!" : preparing ? "Pagamento confirmado" : waiting ? "Aguardando o pagamento" : data?.status === "payment_failed" ? "O pagamento não foi aprovado" : data?.status === "checkout_expired" ? "A sessão de pagamento expirou" : "Continue sua contratação";
  const text = active ? "Seu acesso está liberado. Comece pelo contato da secretaria para que a comunidade saiba como falar com a paróquia." : preparing ? "Estamos preparando seu acesso. Não é preciso pagar de novo." : waiting ? "Esta página se atualiza sozinha. Não inicie outro pagamento enquanto isso." : "Seus dados estão salvos. Você pode tentar de novo pela revisão.";
  return <SubscriptionShell compact step={active ? undefined : 2} signedIn><section className="max-w-xl pb-4 sm:pb-8">
    {query.isPending ? <p role="status" className="py-10 text-center text-muted">Consultando sua assinatura…</p> : query.isError ? <><Failure message="Não foi possível consultar a confirmação agora. Isso não significa que seu pagamento falhou." /><div className="grid gap-3"><button className={bigButton} onClick={() => void query.refetch()}>Consultar novamente</button><Link to="/login?continuar=assinatura" className={outlineClass}>Entrar novamente</Link></div></> : <>
      <span className={`mb-5 grid size-16 place-items-center rounded-2xl ${tone}`}>{icon}</span>
      <h1 className="m-0 text-3xl font-extrabold leading-tight tracking-tight text-balance sm:text-4xl">{title}</h1>
      <p aria-live="polite" className="mb-6 mt-3 text-base leading-7 text-muted">{text}</p>
      {/* Once access is released the progress adds nothing; it only reassures while waiting. */}
      {phase && phase !== "active" ? <PaymentProgress phase={phase} /> : null}
      {data ? <ParishSummary data={data} /> : null}
      {active ? <>
        <Link to={`/${data.tenantSlug}/admin/paroquia/dados`} onClick={() => void client.invalidateQueries({ queryKey: ["session"] })} className={bigButton}>Preencher dados e contato<ArrowRight size={20} aria-hidden="true" /></Link>
        <Link to={`/${data.tenantSlug}/admin/boas-vindas`} onClick={() => void client.invalidateQueries({ queryKey: ["session"] })} className={`${secondaryClass} mt-2 w-full`}>Ver todos os primeiros passos</Link>
      </>
        : !waiting && !preparing ? <Link to="/assinar" className={bigButton}>{problem ? "Tentar de novo" : "Voltar à revisão"}<ArrowRight size={20} aria-hidden="true" /></Link>
        : <button type="button" className={`${outlineClass} w-full`} disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw size={16} className={query.isFetching ? "animate-spin motion-reduce:animate-none" : ""} aria-hidden="true" />{query.isFetching ? "Consultando…" : "Verificar agora"}</button>}
      {data?.demo && waiting && import.meta.env.DEV ? <Link to="/__demo/pagamento" className={`${outlineClass} mt-3 w-full`}>Voltar ao simulador de pagamento</Link> : null}
    </>}
  </section></SubscriptionShell>;
}
