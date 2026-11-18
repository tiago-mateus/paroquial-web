import { ArrowLeft, CalendarDays, Phone, Share2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { PublicChurch } from "../../shared/api/churches";
import type { CalendarEvent } from "../../shared/api/events";
import { getChurchDirectionsHref } from "../../shared/api/churches";
import { DirectionsLink } from "../../shared/components/DirectionsLink";
import { formatDistance } from "./churches.utils";

export function ChurchSummary({ church, distanceKm, nextEvent, tenantSlug, onBackToList, plain = false }: { church: PublicChurch; distanceKm?: number; nextEvent?: CalendarEvent; tenantSlug: string; onBackToList?: () => void; plain?: boolean }) {
  const directionsHref = getChurchDirectionsHref(church);
  const address = church.endereco?.trim() || "Endereço a confirmar";
  const [shareFeedback, setShareFeedback] = useState<{ id: string; text: string } | null>(null);
  const phoneHref = church.telefone?.trim() ? `tel:${church.telefone.replace(/[^\d+]/g, "")}` : null;
  async function shareChurch() {
    const data = { title: church.nome, text: `${church.nome}\n${address}`, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(`${data.text}\n${data.url}`); setShareFeedback({ id: church.id, text: "Link copiado." }); }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareFeedback({ id: church.id, text: "Não foi possível compartilhar. Tente novamente." });
    }
  }
  return (
    <section aria-label="Informações da igreja" className={plain ? "min-w-0 p-4" : "min-w-0 rounded-xl border border-line bg-surface p-4"}>
      {onBackToList ? <button type="button" onClick={onBackToList} className="mb-2 inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-semibold text-primary hover:bg-selection focus-visible:outline-2 focus-visible:outline-focus lg:hidden"><ArrowLeft size={16} aria-hidden="true" />Voltar à lista</button> : null}
      <h2 tabIndex={-1} className="m-0 text-xl font-bold leading-7 text-primary focus-visible:outline-2 focus-visible:outline-focus">{church.nome}</h2>
      <p className="mb-0 mt-1 text-[13px] leading-5 text-muted">{church.tipo === "matriz" ? "Matriz" : church.tipo === "capela" ? "Capela" : "Comunidade"}{distanceKm !== undefined ? ` · ${formatDistance(distanceKm)} de você` : ""}</p>
      <p className="mb-0 mt-3 text-base leading-6 text-ink">{address}</p>
      <div className="mt-4 grid gap-2">
        <DirectionsLink href={directionsHref} destination={church.nome} trailingIcon className="justify-center py-2" />
        <div className="flex flex-wrap gap-x-4">
          {phoneHref ? <a href={phoneHref} aria-label={`Ligar para ${church.nome}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-semibold text-primary hover:bg-selection focus-visible:outline-2 focus-visible:outline-focus"><Phone size={16} aria-hidden="true" />Ligar</a> : null}
          <button type="button" onClick={() => void shareChurch()} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-semibold text-primary hover:bg-selection focus-visible:outline-2 focus-visible:outline-focus"><Share2 size={16} aria-hidden="true" />Compartilhar</button>
        </div>
      </div>
      {shareFeedback?.id === church.id ? <p role="status" className="mb-0 mt-2 text-sm leading-5 text-muted">{shareFeedback.text}</p> : null}
      {nextEvent ? <Link to={`/${tenantSlug}/calendario?date=${nextEvent.start.slice(0, 10)}`} className="mt-3 flex min-h-11 items-start gap-2 border-t border-line pt-4 text-base leading-6 hover:text-primary focus-visible:outline-2 focus-visible:outline-focus"><CalendarDays size={18} aria-hidden="true" className="mt-1 shrink-0 text-primary" /><span className="min-w-0"><span className="block text-[13px] font-semibold text-primary">Próximo evento</span><strong className="block font-semibold text-ink">{nextEvent.title}</strong><span className="block text-sm text-muted">{new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(nextEvent.start))}</span></span></Link> : null}
    </section>
  );
}
