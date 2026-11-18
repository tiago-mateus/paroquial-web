import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarClock, CircleAlert } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getSubscription } from "./subscription.api";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

/**
 * Billing problems are surfaced on every admin page, not only inside "Minha assinatura":
 * a failed payment nobody sees turns into an involuntary cancellation.
 * Shares the subscription query with SubscriptionPage, so both stay in sync.
 */
export function SubscriptionBanner() {
  const { tenantSlug = "" } = useParams();
  const { pathname } = useLocation();
  const href = `/${tenantSlug}/admin/assinatura`;
  const query = useQuery({ queryKey: ["subscription", tenantSlug], queryFn: () => getSubscription(tenantSlug), enabled: Boolean(tenantSlug), retry: false, staleTime: 5 * 60 * 1000 });
  const data = query.data;
  // The subscription page already explains the state in full; repeating it there is noise.
  if (!data || pathname === href) return null;

  const notice = data.status === "past_due"
    ? { urgent: true, text: "O último pagamento não foi aprovado. Regularize para manter o site no ar.", action: "Regularizar" }
    : data.status === "canceled"
      ? { urgent: true, text: "A assinatura foi encerrada.", action: "Ver assinatura" }
      : data.cancelAtPeriodEnd
        ? { urgent: false, text: `A assinatura termina em ${formatDate(data.currentPeriodEnd)}.`, action: "Manter assinatura" }
        : null;
  if (!notice) return null;

  const Icon = notice.urgent ? CircleAlert : CalendarClock;
  return <div role={notice.urgent ? "alert" : "status"} className={notice.urgent ? "bg-danger/10 text-danger" : "bg-selection text-ink"}>
    <div className="mx-auto flex max-w-316 flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] text-sm leading-6 md:px-6 xl:px-8">
      <Icon size={18} aria-hidden="true" className={`shrink-0 ${notice.urgent ? "text-danger" : "text-primary"}`} />
      <p className="m-0 min-w-0 flex-1">{notice.text}</p>
      {data.canManage ? <Link to={href} className={`inline-flex min-h-11 items-center gap-1.5 font-semibold underline-offset-2 hover:underline ${notice.urgent ? "text-danger" : "text-primary"}`}>{notice.action}<ArrowRight size={16} aria-hidden="true" /></Link> : <span className="text-muted">Avise o responsável pela assinatura.</span>}
    </div>
  </div>;
}
