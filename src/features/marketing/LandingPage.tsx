import { launchMode } from "../../shared/launchMode";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Check,
  Church,
  Clock3,
  ExternalLink,
  Link2,
  MessageCircle,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  LandingHeroScreenshots,
  LandingScreenshotShowcase,
  LandingDesktopScreenshots,
  PublicScreenshotsProvider,
} from "./LandingProductScreenshots";
import { money, plans, subscriptionHref, type PlanId } from "./offer";
import { PlanPricing } from "./PlanPricing";

const container = "mx-auto w-full max-w-[1280px] px-5 md:px-10";
const primaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-base font-bold text-white transition-colors hover:bg-primary-hover";
const questions = [
  [
    "Os fiéis precisam instalar um aplicativo?",
    "Não. A programação e as informações públicas podem ser consultadas pelo navegador do celular, tablet ou computador.",
  ],
  [
    "O que a secretaria consegue atualizar?",
    "A programação, os horários de confissão, as igrejas, os endereços, os contatos, os destaques e os canais da paróquia. A disponibilidade de recursos depende do plano e das condições confirmadas na contratação.",
  ],
  [
    "Os valores apresentados são mensais?",
    "Sim. Básico, Premium e Pro apresentam o valor da mensalidade. Não há cobrança anual ou parcelamento sendo oferecidos nesta página.",
  ],
  [
    "Todos os recursos dos planos já estão confirmados?",
    "Confira os recursos incluídos no resumo antes de pagar. Itens identificados como em definição, como comunidades no Premium, não estão incluídos na contratação.",
  ],
  [
    "Como funciona a contratação?",
    launchMode ? "Escolha o plano, informe os dados da paróquia e envie a solicitação pelo WhatsApp. A confirmação é combinada na conversa." : "Escolha o plano, crie sua conta e informe os dados da paróquia. Depois de revisar, continue para o pagamento na plataforma. O acesso é preparado após a confirmação, e você pode retomar pelo login.",
  ],
  [
    "Como conhecer o Paroquial antes de escolher?",
    "Veja as capturas das telas públicas nesta página e converse pelo WhatsApp para solicitar uma apresentação. A mensagem já identifica o plano de seu interesse; você pode editá-la antes de enviar.",
  ],
  [
    "A assinatura inclui recebimento de doações?",
    "Esta oferta não inclui um sistema de cobrança ou processamento de doações. O Paroquial permite reunir os canais oficiais da paróquia.",
  ],
];

export function LandingPage() {
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>("premium");
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId)!;
  const contactHref = subscriptionHref("monthly", selectedPlanId, "demo");
  useEffect(() => {
    const previous = document.title;
    document.title = "Paroquial — Sua paróquia, mais perto de todos";
    return () => {
      document.title = previous;
    };
  }, []);
  return (
    <PublicScreenshotsProvider>
      <div className="landing-theme min-h-dvh overflow-x-clip bg-canvas text-ink">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-ink focus:px-5 focus:py-3 focus:text-white"
        >
          Pular para o conteúdo
        </a>
        <header className="absolute top-0 z-30 w-full">
          <div
            className={`${container} flex h-20 items-center justify-between gap-3 md:h-24`}
          >
            <Brand />
            <nav
              aria-label="Navegação principal"
              className="flex items-center gap-3 text-sm font-bold md:gap-7"
            >
              <a
                className="hidden min-h-11 items-center hover:text-primary md:inline-flex"
                href="#demonstracao"
              >
                Telas do app
              </a>
              <a
                className="hidden min-h-11 items-center hover:text-primary md:inline-flex"
                href="#duvidas"
              >
                Dúvidas
              </a>
              <Link
                className="inline-flex min-h-11 items-center hover:text-primary"
                to="/login"
              >
                Entrar
              </Link>
              <a
                className="inline-flex min-h-11 items-center rounded-xl bg-ink px-4 py-3 text-white hover:bg-primary-hover"
                href="#planos"
              >
                Ver planos
              </a>
            </nav>
          </div>
        </header>
        <main
          id="conteudo"
          tabIndex={-1}
          className="m-0 max-w-none p-0 focus:outline-none"
        >
          <section
            aria-labelledby="apresentacao"
            className="relative isolate overflow-hidden pb-12 pt-28 lg:pb-24 lg:pt-40"
          >
            <div
              aria-hidden="true"
              className="absolute inset-y-0 right-0 -z-10 w-full bg-selection lg:w-1/2 lg:rounded-bl-[80px]"
            />
            <div
              className={`${container} grid items-center gap-8 lg:grid-cols-2 lg:gap-14`}
            >
              <div className="motion-safe:animate-landing-enter">
                <h1
                  id="apresentacao"
                  className="m-0 max-w-[13ch] font-display text-[44px] font-medium leading-[1.06] tracking-tight sm:text-6xl lg:text-[80px]"
                >
                  Sua paróquia.
                  <br />
                  Mais perto de todos.
                </h1>
                <p className="mb-5 mt-5 max-w-[41ch] text-base leading-7 text-muted md:text-lg md:leading-8">
                  Agenda, igrejas e canais em um só lugar. Para quem organiza e
                  para quem participa.
                </p>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <a
                    className={`${primaryButton} max-sm:w-full`}
                    href="#planos"
                  >
                    Conhecer os planos
                    <ArrowRight size={18} aria-hidden="true" />
                  </a>
                  <a
                    className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-ink hover:text-primary"
                    href="#demonstracao"
                  >
                    Ver telas do app
                    <ArrowDown size={16} aria-hidden="true" />
                  </a>
                </div>
                <p className="mb-0 mt-4 hidden text-sm text-muted lg:block">
                  No navegador do celular, tablet ou computador.
                </p>
              </div>
              <LandingHeroScreenshots />
            </div>
          </section>
          <section
            aria-label="Recursos do Paroquial"
            className="border-y border-line bg-surface py-6 md:py-8"
          >
            <div
              className={`${container} grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-4`}
            >
              {[
                { label: "Agenda paroquial", Icon: CalendarDays },
                { label: "Igrejas e comunidades", Icon: Church },
                { label: "Horários de confissão", Icon: Clock3 },
                { label: "Canais oficiais", Icon: Link2 },
              ].map(({ label, Icon }) => (
                <p
                  key={label}
                  className="flex items-center justify-center gap-2 text-sm font-bold md:text-base"
                >
                  <Icon
                    size={18}
                    className="shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  {label}
                </p>
              ))}
            </div>
          </section>
          <div id="recursos" className="scroll-mt-8">
            <LandingScreenshotShowcase />
          </div>
          <CommunitySection />
          <PlanPricing onSelect={setSelectedPlanId} />
          <section
            id="duvidas"
            aria-labelledby="titulo-duvidas"
            className="scroll-mt-8 border-y border-line bg-surface py-16 md:py-24"
          >
            <div
              className={`${container} grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20`}
            >
              <div>
                <h2
                  id="titulo-duvidas"
                  className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl"
                >
                  Vamos tirar suas dúvidas.
                </h2>
                <p className="mt-5 text-lg leading-8 text-muted">
                  Conheça o produto e converse sobre o que sua paróquia precisa.
                </p>
              </div>
              <div className="divide-y divide-line border-y border-line">
                {questions.map(([question, answer]) => (
                  <details key={question} className="group">
                    <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-5 text-base font-bold [&::-webkit-details-marker]:hidden md:text-lg">
                      {question}
                      <Plus
                        size={20}
                        className="shrink-0 transition-transform group-open:rotate-45 motion-reduce:transition-none"
                        aria-hidden="true"
                      />
                    </summary>
                    <p className="mb-5 max-w-[60ch] text-base leading-7 text-muted">
                      {answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </section>
          <section
            id="assinatura"
            aria-labelledby="titulo-assinatura"
            className="scroll-mt-8 bg-accent py-16 md:py-24"
          >
            <div
              className={`${container} grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20`}
            >
              <div>
                <h2
                  id="titulo-assinatura"
                  className="max-w-[16ch] text-4xl font-extrabold leading-tight tracking-tight md:text-6xl"
                >
                  Sua paróquia pode começar por aqui.
                </h2>
                <p className="mt-5 max-w-[48ch] text-lg leading-8 text-muted">
                  Escolha o plano e faça seu cadastro. Se precisar de ajuda,
                  nossa conversa continua disponível pelo WhatsApp.
                </p>
              </div>
              <div className="min-w-0">
                <label
                  htmlFor="plano-interesse"
                  className="mb-2 block text-base font-bold"
                >
                  Tenho interesse no plano
                </label>
                <select
                  id="plano-interesse"
                  value={selectedPlanId}
                  onChange={(event) =>
                    setSelectedPlanId(event.target.value as PlanId)
                  }
                  className="min-h-12 w-full rounded-xl border border-ink/20 bg-surface px-4 py-3 text-base font-semibold text-ink"
                >
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — {money(plan.monthly)}/mês
                    </option>
                  ))}
                </select>
                <Link to={`/assinar?plano=${selectedPlanId}`} className={`${primaryButton} mt-4 w-full`}>Assinar {selectedPlan.name}<ArrowRight size={18} aria-hidden="true" /></Link>
                {contactHref ? (
                  <>
                    <a
                      href={contactHref}
                      className="mt-4 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-ink px-4 py-4 text-base font-bold text-white hover:bg-primary-hover"
                    >
                      <MessageCircle
                        size={20}
                        className="shrink-0"
                        aria-hidden="true"
                      />
                      Solicitar demonstração pelo WhatsApp
                      <ExternalLink
                        size={16}
                        className="shrink-0"
                        aria-hidden="true"
                      />
                    </a>
                    <p className="mt-3 text-sm leading-6 text-muted">
                      A conversa começa com seu interesse no plano{" "}
                      {selectedPlan.name}. Você pode editar a mensagem antes de
                      enviar.
                    </p>
                  </>
                ) : (
                  <p
                    role="status"
                    className="mt-4 text-base leading-7 text-ink"
                  >
                    O atendimento será disponibilizado em breve. Enquanto isso,{" "}
                    <a href="#demonstracao" className="font-bold underline">
                      conheça as telas do aplicativo
                    </a>
                    .
                  </p>
                )}
              </div>
            </div>
          </section>
        </main>
        <footer className="border-t border-line bg-canvas py-8">
          <div
            className={`${container} flex flex-wrap items-center gap-x-8 gap-y-4`}
          >
            <Brand />
            <p className="text-sm text-muted md:flex-1">
              Informação que aproxima a comunidade.
            </p>
            <Link
              className="inline-flex min-h-11 items-center text-sm font-bold hover:text-primary"
              to="/login"
            >
              Entrar no painel
            </Link>
            <a
              className="inline-flex min-h-11 items-center text-sm font-bold hover:text-primary"
              href="#planos"
            >
              Planos
            </a>
          </div>
        </footer>
      </div>
    </PublicScreenshotsProvider>
  );
}

function Brand() {
  return (
    <Link
      to="/"
      aria-label="Paroquial, início"
      className="inline-flex min-h-11 shrink-0 items-center gap-2 text-xl font-extrabold tracking-tight text-ink sm:text-2xl"
    >
      <Church size={27} className="text-primary" aria-hidden="true" />
      paroquial.
    </Link>
  );
}

function CommunitySection() {
  return (
    <section
      id="comunidade"
      aria-labelledby="titulo-comunidade"
      className="mx-3 scroll-mt-8 overflow-hidden rounded-[32px] bg-ink py-12 text-white md:mx-8 md:rounded-[56px] md:py-20"
    >
      <div
        className={`${container} grid items-center gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-12`}
      >
        <div>
          <h2
            id="titulo-comunidade"
            className="max-w-[17ch] text-4xl font-extrabold leading-tight tracking-tight md:text-5xl"
          >
            Perto da comunidade. Em qualquer tela.
          </h2>
          <p className="mt-5 max-w-[43ch] text-lg leading-8 text-white/85">
            No celular ou no computador, a paróquia tem seu espaço. A
            programação e os canais continuam fáceis de encontrar.
          </p>
          <ul className="mt-7 grid list-none gap-4 p-0">
            <Benefit>Programação com horário e local.</Benefit>
            <Benefit>Igrejas, comunidades e canais oficiais.</Benefit>
            <Benefit>Acesso pelo navegador, sem instalar nada.</Benefit>
          </ul>
        </div>
        <LandingDesktopScreenshots />
      </div>
    </section>
  );
}

function Benefit({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-base leading-7">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-accent text-accent-ink">
        <Check size={17} aria-hidden="true" />
      </span>
      {children}
    </li>
  );
}
