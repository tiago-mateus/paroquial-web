import { CalendarDays, Check, List, MapPin, Navigation, Phone, Share2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { PublicChurch } from "../../shared/api/churches";
import type { CalendarEvent } from "../../shared/api/events";
import { getChurchDirectionsHref } from "../../shared/api/churches";
import { ChurchThumbnail } from "./ChurchThumbnail";

export function ChurchSummary({ church, onOpenList, distanceKm, nextEvent, tenantSlug, embedded = false }: { church: PublicChurch; onOpenList?: () => void; distanceKm?: number; nextEvent?: CalendarEvent; tenantSlug: string; embedded?: boolean }) {
  const directionsHref = getChurchDirectionsHref(church);
  const address = church.endereco?.trim() || "Endereço a confirmar";
  const [copied, setCopied] = useState(false);
  const phoneHref = church.telefone ? `tel:${church.telefone.replace(/[^\d+]/g, "")}` : null;
  async function shareChurch() {
    const data = { title: church.nome, text: `${church.nome}\n${address}`, url: window.location.href };
    if (navigator.share) await navigator.share(data);
    else { await navigator.clipboard.writeText(`${data.text}\n${data.url}`); setCopied(true); window.setTimeout(() => setCopied(false), 2500); }
  }

  return (
    <section aria-label="Igreja selecionada" className={embedded ? "rounded-2xl bg-slate-50 p-4" : "rounded-[1.65rem] border border-white/70 bg-white/95 p-4 shadow-[0_22px_60px_rgb(15_23_42/0.18)] backdrop-blur-xl"}>
      <div className="flex items-center gap-3">
        <ChurchThumbnail src={church.urlImg} name={church.nome} className="h-14 w-14" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[0.6rem] font-extrabold uppercase tracking-[0.12em] text-amber-700">
            <span>{church.tipo === "matriz" ? "Matriz" : church.tipo === "capela" ? "Capela" : "Comunidade"}</span>
            {distanceKm !== undefined ? <><span className="h-1 w-1 rounded-full bg-slate-300" /><span className="normal-case tracking-normal text-slate-500">{formatDistance(distanceKm)} de você</span></> : null}
          </div>
          <h2 className="m-0 line-clamp-2 text-sm font-bold leading-tight text-slate-950">{church.nome}</h2>
          <p className="mb-0 mt-1 flex min-w-0 items-start gap-1 text-xs leading-4 text-slate-500"><MapPin size={12} className="mt-0.5 flex-none" /><span className="line-clamp-2">{address}</span></p>
        </div>
      </div>
      {nextEvent ? <Link to={`/${tenantSlug}/calendario?date=${nextEvent.start.slice(0, 10)}`} className="mt-3 flex items-center gap-2 border-t border-slate-200/80 pt-3 text-xs text-slate-600"><CalendarDays size={15} className="flex-none text-amber-700" /><span className="min-w-0 flex-1 truncate"><strong className="text-slate-800">Próximo:</strong> {nextEvent.title}</span><span className="flex-none font-semibold text-slate-500">{new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(nextEvent.start))}</span></Link> : null}
      <div className="mt-3 flex items-center gap-2">
        {directionsHref ? (
          <a href={directionsHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800">
            <Navigation size={15} /> Como chegar
          </a>
        ) : null}
        {phoneHref ? <a href={phoneHref} aria-label={`Ligar para ${church.nome}`} title="Ligar" className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200"><Phone size={15} /></a> : null}
        <button type="button" onClick={() => void shareChurch()} aria-label={copied ? "Link copiado" : `Compartilhar ${church.nome}`} title={copied ? "Link copiado" : "Compartilhar"} className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200">{copied ? <Check size={15} /> : <Share2 size={15} />}</button>
        {onOpenList ? <button type="button" onClick={onOpenList} aria-label="Ver igrejas" title="Ver igrejas" className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-amber-50 text-amber-800 transition hover:bg-amber-100"><List size={16} /></button> : null}
      </div>
    </section>
  );
}

function formatDistance(value: number) { return value < 1 ? `${Math.round(value * 1000)} m` : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`; }
