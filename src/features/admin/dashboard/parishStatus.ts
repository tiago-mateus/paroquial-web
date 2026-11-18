import { AlertCircle, Church, ContactRound, Image, MapPin, CalendarPlus, type LucideIcon } from "lucide-react";
import type { PublicChurch } from "../../../shared/api/churches";
import type { CalendarEvent } from "../../../shared/api/events";
import type { Tenant } from "../../../shared/api/tenants";
import { parseWallClock, wallDateKey } from "../../../shared/lib/parishTime";
import { countEventsWithoutLocation } from "./agendaOverview";

export type StatusItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  /** Informação essencial para o site funcionar; entra na barra de progresso. */
  essential?: boolean;
};

export type ParishStatus = {
  items: StatusItem[];
  /** Essenciais configurados / total, só quando todos os dados necessários foram carregados. */
  progress?: { done: number; total: number };
};

type Input = {
  base: string;
  todayKey: string;
  tenant?: Tenant;
  churches?: PublicChurch[];
  /** Eventos de ontem até o fim da janela de consulta. */
  events?: CalendarEvent[];
  /** Quantos dias à frente a consulta cobre (para o texto da pendência de agenda vazia). */
  windowDays: number;
};

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/**
 * Reúne o que antes estava espalhado entre "Revisão do site", "Primeiros passos" e "Situação do site",
 * sem duplicar o passo a passo: aqui só entram os itens que ainda pedem ação.
 * Cada item só existe quando a fonte de dados correspondente carregou.
 */
export function buildParishStatus({ base, todayKey, tenant, churches, events, windowDays }: Input): ParishStatus {
  const essentials: StatusItem[] = [];
  const reviews: StatusItem[] = [];

  if (tenant && !tenant.telefone?.trim() && !tenant.contato?.trim())
    essentials.push({ id: "contato", label: "Contato não informado", description: "Adicione um canal para os fiéis", href: `${base}/paroquia/dados`, icon: ContactRound, essential: true });
  if (churches && churches.length === 0)
    essentials.push({ id: "igreja", label: "Nenhuma igreja cadastrada", description: "Cadastre o primeiro local para aparecer no mapa do site", href: `${base}/paroquia/igrejas?action=new`, icon: Church, essential: true });
  if (tenant && !tenant.homeHeader?.imageUrl?.trim())
    essentials.push({ id: "capa", label: "Imagem principal ausente", description: "A página pública está sem imagem", href: `${base}/site/pagina-inicial`, icon: Image, essential: true });

  if (tenant && !tenant.endereco?.trim())
    reviews.push({ id: "endereco", label: "Endereço incompleto", description: "Revise os dados institucionais", href: `${base}/paroquia/dados`, icon: MapPin });
  if (events) {
    const upcomingCount = events.filter((event) => { const start = parseWallClock(event.start); return start !== null && wallDateKey(start) >= todayKey; }).length;
    if (upcomingCount === 0)
      reviews.push({ id: "agenda-vazia", label: `Sem eventos nos próximos ${windowDays} dias`, description: "A agenda pública ficará vazia", href: `${base}/calendario?date=${todayKey}&action=new`, icon: CalendarPlus });
    const withoutLocation = countEventsWithoutLocation(events, todayKey);
    if (withoutLocation)
      reviews.push({ id: "eventos-sem-local", label: plural(withoutLocation, "evento sem local", "eventos sem local"), description: "Informe onde a atividade acontece", href: `${base}/calendario?date=${todayKey}`, icon: AlertCircle });
  }
  if (churches) {
    const withoutImage = churches.filter((church) => !church.urlImg?.trim()).length;
    if (withoutImage)
      reviews.push({ id: "igrejas-sem-imagem", label: plural(withoutImage, "igreja sem imagem", "igrejas sem imagem"), description: "Complete a apresentação dos locais no site público.", href: `${base}/paroquia/igrejas`, icon: Image });
  }

  const ready = Boolean(tenant && churches);
  const total = 3;
  return { items: [...essentials, ...reviews], progress: ready ? { done: total - essentials.length, total } : undefined };
}
