import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Check, ChevronRight, Church, Clock3, ContactRound, Copy, Globe, Image as ImageIcon, MessageCircleMore, PartyPopper, RefreshCw, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTenantChurches } from "../../shared/api/churches";
import { getAdminTenantEvents } from "../../shared/api/events";
import { getTenant } from "../../shared/api/tenants";
import { classNames } from "../../shared/lib/classNames";
import { AdminPageHeader } from "../admin/AdminPageHeader";
import { toDateKey } from "../calendar/calendar.utils";

type Step = {
  id: string;
  title: string;
  description: string;
  doneDescription: string;
  action: string;
  href: string;
  icon: LucideIcon;
  minutes: number;
  /** undefined enquanto não foi possível verificar. */
  done?: boolean;
  onOpen?: () => void;
};

const actionClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none";

export function WelcomePage() {
  const { tenantSlug = "" } = useParams();
  const base = `/${tenantSlug}/admin`;
  const today = new Date();
  const rangeStart = toDateKey(today);
  const rangeEnd = toDateKey(new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()));

  const tenantQuery = useQuery({ queryKey: ["tenant", tenantSlug], queryFn: () => getTenant(tenantSlug), enabled: Boolean(tenantSlug) });
  const churchesQuery = useQuery({ queryKey: ["churches", tenantSlug], queryFn: () => getTenantChurches(tenantSlug), enabled: Boolean(tenantSlug), retry: false });
  const eventsQuery = useQuery({ queryKey: ["admin", "events", tenantSlug, rangeStart, rangeEnd], queryFn: () => getAdminTenantEvents(tenantSlug, rangeStart, rangeEnd), enabled: Boolean(tenantSlug) });
  const [siteVisited, setSiteVisited] = useState(() => readSiteVisited(tenantSlug));

  const tenant = tenantQuery.data;
  const steps: Step[] = [
    {
      id: "dados",
      title: "Confira os dados e o contato",
      description: "Informe o telefone e o contato da secretaria para os fiéis falarem com a paróquia.",
      doneDescription: "Contato informado.",
      action: "Preencher dados",
      href: `${base}/paroquia/dados`,
      icon: ContactRound,
      minutes: 2,
      done: tenant ? Boolean(tenant.telefone?.trim() || tenant.contato?.trim()) : undefined,
    },
    {
      id: "igreja",
      title: "Cadastre a primeira igreja",
      description: "Com nome, endereço e localização, a igreja aparece no mapa do site.",
      doneDescription: plural(churchesQuery.data?.length ?? 0, "igreja cadastrada", "igrejas cadastradas"),
      action: "Cadastrar igreja",
      href: `${base}/paroquia/igrejas?action=new`,
      icon: Church,
      minutes: 3,
      done: churchesQuery.data ? churchesQuery.data.length > 0 : undefined,
    },
    {
      id: "celebracao",
      title: "Adicione a primeira celebração",
      description: "Cadastre uma missa ou atividade. Se ela acontece toda semana, basta marcar a repetição.",
      doneDescription: "A agenda já tem programação publicada.",
      action: "Criar celebração",
      href: `${base}/calendario?date=${rangeStart}&action=new`,
      icon: CalendarDays,
      minutes: 2,
      done: eventsQuery.data ? eventsQuery.data.length > 0 : undefined,
    },
    {
      id: "capa",
      title: "Coloque uma foto na capa",
      description: "Uma foto da igreja ou da comunidade faz a página parecer da sua paróquia.",
      doneDescription: "Capa com foto própria.",
      action: "Escolher foto",
      href: `${base}/site/pagina-inicial`,
      icon: ImageIcon,
      minutes: 2,
      done: tenant ? Boolean(tenant.homeHeader?.imageUrl?.trim()) : undefined,
    },
    {
      id: "site",
      title: "Veja o site público",
      description: "Confira como as informações aparecem para a comunidade.",
      doneDescription: "Site visitado. Volte sempre que mudar algo.",
      action: "Abrir site público",
      href: `/${tenantSlug}`,
      icon: Globe,
      minutes: 1,
      done: siteVisited,
      onOpen: () => {
        writeSiteVisited(tenantSlug);
        setSiteVisited(true);
      },
    },
  ];

  const loading = tenantQuery.isLoading || churchesQuery.isLoading || eventsQuery.isLoading;
  const failed = tenantQuery.isError || churchesQuery.isError || eventsQuery.isError;
  const doneCount = steps.filter((step) => step.done).length;
  const allDone = doneCount === steps.length;
  const current = loading ? undefined : steps.find((step) => !step.done);
  const percent = Math.round((doneCount / steps.length) * 100);
  const retry = () => {
    void tenantQuery.refetch();
    void churchesQuery.refetch();
    void eventsQuery.refetch();
  };

  return (
    <>
      <AdminPageHeader title="Bem-vindo ao Paroquial" description={tenant?.name ?? "Seu espaço está pronto para começar."} />
      {/* Mesmo container do AdminPageHeader, para alinhar título e conteúdo no desktop. */}
      <div className="mx-auto w-full max-w-316 px-4 pb-10 pt-5 md:px-6 xl:px-8">
      <div className="max-w-3xl">
        <section aria-labelledby="welcome-progress-title" className="rounded-2xl bg-selection/60 p-5 sm:p-6">
          {allDone ? (
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface text-primary shadow-sm">
                <PartyPopper size={24} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 id="welcome-progress-title" className="m-0 text-xl font-bold leading-7">Tudo pronto para a comunidade!</h2>
                <p className="m-0 mt-1 text-[15px] leading-6 text-muted">
                  O essencial já está publicado. Divulgue o link para os fiéis; a partir de agora, o painel mostra a programação do dia e o que precisa de revisão.
                </p>
                <ShareParishLink tenantSlug={tenantSlug} tenantName={tenant?.name} />
              </div>
            </div>
          ) : (
            <>
              <h2 id="welcome-progress-title" className="m-0 text-xl font-bold leading-7">Vamos deixar o site pronto para os fiéis</h2>
              <p className="m-0 mt-1 text-[15px] leading-6 text-muted">
                São {steps.length} passos rápidos, cerca de {steps.reduce((sum, step) => sum + step.minutes, 0)} minutos no total. Você pode parar e continuar depois: o progresso fica salvo.
              </p>
            </>
          )}
          <div className="mt-5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-semibold" aria-live="polite">
                {loading ? "Verificando seu progresso…" : `${doneCount} de ${steps.length} passos concluídos`}
              </span>
              {!loading ? <span className="text-muted">{percent}%</span> : null}
            </div>
            <div
              role="progressbar"
              aria-label="Progresso dos primeiros passos"
              aria-valuemin={0}
              aria-valuemax={steps.length}
              aria-valuenow={loading ? undefined : doneCount}
              className="mt-2 h-2 overflow-hidden rounded-full bg-surface"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
                style={{ width: loading ? "0%" : `${Math.max(percent, 4)}%` }}
              />
            </div>
          </div>
        </section>

        {failed ? (
          <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-4 py-3 text-sm text-muted">
            <span>Não foi possível verificar todos os passos.</span>
            <button type="button" onClick={retry} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 font-semibold text-primary hover:bg-selection">
              <RefreshCw size={15} aria-hidden="true" />
              Tentar novamente
            </button>
          </div>
        ) : null}

        <ol className="m-0 mt-6 grid list-none gap-3 p-0" aria-label="Primeiros passos">
          {steps.map((step, index) => (
            <StepItem key={step.id} step={step} number={index + 1} total={steps.length} current={current?.id === step.id} loading={loading} />
          ))}
        </ol>

        <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center">
          <Link
            to={base}
            className={classNames(
              actionClass,
              allDone ? "bg-primary text-white hover:bg-primary-hover" : "border border-line bg-surface text-ink hover:bg-selection/50",
            )}
          >
            {allDone ? "Ir para o painel" : "Explorar o painel por conta própria"}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link to={`${base}/assinatura`} className={`${actionClass} px-3 text-primary hover:bg-selection/50`}>
            Minha assinatura
          </Link>
        </div>
        <p className="m-0 mt-3 text-sm leading-6 text-muted">
          Este guia continua disponível em <strong className="font-semibold text-ink">Início › Primeiros passos</strong>.
        </p>
      </div>
      </div>
    </>
  );
}

function StepItem({ step, number, total, current, loading }: { step: Step; number: number; total: number; current: boolean; loading: boolean }) {
  const Icon = step.icon;
  const titleId = `welcome-step-${step.id}`;

  if (current) {
    return (
      <li aria-current="step" aria-labelledby={titleId} className="rounded-2xl border-2 border-primary bg-surface p-5 shadow-[0_12px_32px_-20px_rgb(41_76_112/0.55)] sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-white">
            <Icon size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-primary">Próximo passo · {number} de {total}</p>
            <h3 id={titleId} className="m-0 mt-1 text-lg font-bold leading-7">{step.title}</h3>
            <p className="m-0 mt-1 text-[15px] leading-6 text-muted">{step.description}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted">
            <Clock3 size={15} aria-hidden="true" />
            Cerca de {step.minutes} {step.minutes === 1 ? "minuto" : "minutos"}
          </span>
          <Link to={step.href} onClick={step.onOpen} className={`${actionClass} bg-primary text-white hover:bg-primary-hover`}>
            {step.action}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </li>
    );
  }

  return (
    <li aria-labelledby={titleId}>
      <Link
        to={step.href}
        onClick={step.onOpen}
        className="group flex min-h-18 items-center gap-4 rounded-2xl border border-line bg-surface px-4 py-4 transition-colors hover:border-primary/40 hover:bg-selection/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none sm:px-5"
      >
        <StatusMarker done={step.done} number={number} loading={loading} />
        <span className="min-w-0 flex-1">
          <span id={titleId} className={classNames("block text-base font-semibold leading-6", step.done && "text-muted")}>
            {step.title}
          </span>
          <span className="mt-0.5 block text-sm leading-5 text-muted">
            {step.done ? step.doneDescription : step.description}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary">
          {step.done ? <span className="hidden sm:inline">Revisar</span> : null}
          <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
        </span>
      </Link>
    </li>
  );
}

function StatusMarker({ done, number, loading }: { done?: boolean; number: number; loading: boolean }) {
  if (loading) return <span aria-hidden="true" className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-selection motion-reduce:animate-none" />;
  if (done) {
    return (
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-success text-white">
        <Check size={18} strokeWidth={3} aria-hidden="true" />
        <span className="sr-only">Concluído:</span>
      </span>
    );
  }
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-line text-sm font-bold text-muted">
      {number}
      <span className="sr-only">. Pendente:</span>
    </span>
  );
}

/** Finishing the checklist is the moment to spread the page; WhatsApp is where parish communities talk. */
function ShareParishLink({ tenantSlug, tenantName }: { tenantSlug: string; tenantName?: string }) {
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");
  const url = `${window.location.origin}/${tenantSlug}`;
  const message = `${tenantName ? `${tenantName}: h` : "H"}orários, agenda e contatos da paróquia em um só lugar. ${url}`;
  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied("done"); }
    catch { setCopied("failed"); }
  }
  return <div className="mt-4">
    <div className="flex flex-col gap-2 sm:flex-row">
      <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className={`${actionClass} bg-primary text-white hover:bg-primary-hover`}>
        <MessageCircleMore size={18} aria-hidden="true" />Compartilhar no WhatsApp<span className="sr-only"> (abre em nova aba)</span>
      </a>
      <button type="button" onClick={() => void copy()} className={`${actionClass} border border-line bg-surface text-ink hover:bg-selection/50`}>
        {copied === "done" ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}{copied === "done" ? "Link copiado" : "Copiar link"}
      </button>
    </div>
    <p role="status" className="m-0 mt-2 break-all text-sm leading-6 text-muted">{copied === "failed" ? `Não foi possível copiar. O link é ${url}` : url}</p>
  </div>;
}

function plural(count: number, singular: string, many: string) {
  return `${count} ${count === 1 ? singular : many}.`;
}

const siteVisitedKey = (tenantSlug: string) => `paroquial:welcome:site-visited:${tenantSlug}`;

function readSiteVisited(tenantSlug: string) {
  try {
    return window.localStorage.getItem(siteVisitedKey(tenantSlug)) === "1";
  } catch {
    return false;
  }
}

function writeSiteVisited(tenantSlug: string) {
  try {
    window.localStorage.setItem(siteVisitedKey(tenantSlug), "1");
  } catch {
    // Armazenamento indisponível: o passo volta a aparecer pendente, sem outro impacto.
  }
}
