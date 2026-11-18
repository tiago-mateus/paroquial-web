import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  CalendarDays,
  Church,
  House,
  Link2,
  Maximize2,
  Monitor,
  X,
  ZoomIn,
} from "lucide-react";

const asset = (name: string) =>
  `${import.meta.env.BASE_URL}marketing/screenshots/${name}.webp`;
type Screenshot = {
  src: string;
  label: string;
  alt: string;
  width: number;
  height: number;
};
const mobile = (name: string, label: string, alt: string): Screenshot => ({
  src: asset(name),
  label,
  alt,
  width: 390,
  height: 844,
});

const publicScreenshots = [
  {
    id: "inicio",
    Icon: House,
    description:
      "A identidade da paróquia, os destaques e a programação de hoje, logo na chegada.",
    image: mobile(
      "inicio-mobile",
      "Início",
      "Captura real do início público: capa da paróquia, destaques e agenda de hoje.",
    ),
  },
  {
    id: "agenda",
    Icon: CalendarDays,
    description:
      "Datas, celebrações, horários e locais na mesma tela. Assim a comunidade encontra quando participar.",
    image: mobile(
      "agenda-mobile",
      "Agenda",
      "Captura real da agenda pública, com seletor de datas e lista de celebrações.",
    ),
  },
  {
    id: "igrejas",
    Icon: Church,
    description:
      "O mapa, as igrejas e o caminho para chegar. A comunidade encontra seu próximo destino.",
    image: mobile(
      "igrejas-mobile",
      "Igrejas",
      "Captura real do mapa de igrejas, com marcadores e resumo da Igreja Matriz.",
    ),
  },
  {
    id: "links",
    Icon: Link2,
    description:
      "WhatsApp, redes sociais e os canais oficiais reunidos em um endereço.",
    image: mobile(
      "links-mobile",
      "Links",
      "Captura real da página pública de links e canais oficiais da paróquia.",
    ),
  },
];
const homeDesktop: Screenshot = {
  src: asset("inicio-desktop"),
  label: "Início no computador",
  alt: "Captura real da página inicial pública no computador, com capa, agenda e destaques.",
  width: 1280,
  height: 900,
};
const agendaDesktop: Screenshot = {
  src: asset("agenda-desktop"),
  label: "Agenda no computador",
  alt: "Captura real da agenda pública no computador, com programação e calendário mensal.",
  width: 1280,
  height: 900,
};
const ScreenshotContext = createContext<(screenshot: Screenshot) => void>(
  () => {},
);

export function PublicScreenshotsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [active, setActive] = useState<Screenshot>();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const openScreenshot = (screenshot: Screenshot) => {
    openerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setActive(screenshot);
  };
  useEffect(() => {
    const dialog = dialogRef.current;
    if (active && dialog && !dialog.open) dialog.showModal();
  }, [active]);
  const close = () => dialogRef.current?.close();

  return (
    <ScreenshotContext.Provider value={openScreenshot}>
      {children}
      <dialog
        ref={dialogRef}
        aria-labelledby="captura-ampliada-titulo"
        onClose={() => {
          setActive(undefined);
          openerRef.current?.focus({ preventScroll: true });
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="landing-theme fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[min(1100px,calc(100%-2rem))] max-w-none overflow-auto rounded-2xl border-0 bg-surface p-0 text-ink shadow-2xl backdrop:bg-ink/80"
      >
        {active && (
          <>
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-surface px-4 py-2 sm:px-6">
              <div>
                <h2
                  id="captura-ampliada-titulo"
                  className="text-base font-extrabold"
                >
                  {active.label}
                </h2>
                <p className="text-sm text-muted">
                  Tela real do ambiente de demonstração.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                autoFocus
                aria-label="Fechar captura ampliada"
                className="grid size-11 shrink-0 place-items-center rounded-xl text-ink hover:bg-selection"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>
            <div className="flex justify-center bg-selection/25 p-3 sm:p-5">
              <img
                src={active.src}
                alt={active.alt}
                width={active.width}
                height={active.height}
                className="h-auto max-h-[calc(100dvh-8rem)] w-auto max-w-full object-contain"
              />
            </div>
          </>
        )}
      </dialog>
    </ScreenshotContext.Provider>
  );
}

function ScreenshotButton({
  screenshot,
  className = "",
  eager = false,
  animated = false,
}: {
  screenshot: Screenshot;
  className?: string;
  eager?: boolean;
  animated?: boolean;
}) {
  const open = useContext(ScreenshotContext);
  return (
    <button
      type="button"
      onClick={() => open(screenshot)}
      aria-label={`Ampliar captura real: ${screenshot.label}`}
      className={`group/screen relative block overflow-hidden rounded-[20px] bg-surface text-left shadow-[0_24px_60px_-20px_rgb(16_35_71/0.45)] outline-offset-4 ${animated ? "motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out motion-safe:hover:-translate-y-3 motion-reduce:transform-none" : ""} ${className}`}
    >
      <img
        src={screenshot.src}
        alt={screenshot.alt}
        width={screenshot.width}
        height={screenshot.height}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        decoding="async"
        draggable={false}
        className="block h-auto w-full select-none"
      />
      <span
        className="absolute bottom-4 right-3 grid size-10 place-items-center rounded-full bg-ink/90 text-white shadow-lg transition-colors group-hover/screen:bg-primary"
        aria-hidden="true"
      >
        <Maximize2 size={17} />
      </span>
    </button>
  );
}

function setPerspective(event: PointerEvent<HTMLDivElement>) {
  if (
    event.pointerType !== "mouse" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  const rect = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  event.currentTarget.style.setProperty("--screen-rx", `${-y * 5}deg`);
  event.currentTarget.style.setProperty("--screen-ry", `${x * 6}deg`);
}

export function LandingHeroScreenshots() {
  return (
    <figure className="m-0 mx-auto w-full min-w-0 max-w-[500px]">
      <div
        onPointerMove={setPerspective}
        onPointerLeave={(event) => {
          event.currentTarget.style.setProperty("--screen-rx", "0deg");
          event.currentTarget.style.setProperty("--screen-ry", "0deg");
        }}
        className="relative w-full h-[490px] sm:h-[710px]"
      >
        <div
          className="absolute inset-0 motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-reduce:transform-none"
          style={{
            transform:
              "perspective(1400px) rotateX(var(--screen-rx, 0deg)) rotateY(var(--screen-ry, 0deg))",
          }}
        >
          <div className="absolute right-0 top-12 z-10 w-[54%] rotate-[7deg] motion-reduce:rotate-0">
            <ScreenshotButton
              screenshot={publicScreenshots[1].image}
              eager
              animated
            />
          </div>
          <div className="absolute left-[3%] top-2 z-20 w-[62%] -rotate-[5deg] motion-reduce:rotate-0 motion-safe:animate-landing-screens">
            <ScreenshotButton
              screenshot={publicScreenshots[0].image}
              eager
              animated
            />
          </div>
        </div>
      </div>
      <figcaption className="relative mt-2 text-center text-sm text-ink">
        Telas reais do app · clique para ampliar.
      </figcaption>
    </figure>
  );
}

export function LandingScreenshotShowcase() {
  const [selected, setSelected] = useState("agenda");
  const screen = publicScreenshots.find((item) => item.id === selected)!;
  const open = useContext(ScreenshotContext);

  return (
    <section
      id="demonstracao"
      className="scroll-mt-8 py-16 md:py-24"
      aria-labelledby="titulo-demonstracao"
    >
      <div className="mx-auto grid max-w-[1280px] items-center gap-9 px-5 md:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
        <div>
          <h2
            id="titulo-demonstracao"
            className="max-w-[17ch] text-4xl font-extrabold leading-tight tracking-tight md:text-5xl"
          >
            É assim que a sua comunidade encontra tudo.
          </h2>
          <p className="mt-5 max-w-[43ch] text-lg leading-8 text-muted">
            Do primeiro acesso ao próximo encontro, conheça as telas da parte
            pública do Paroquial.
          </p>
          <div
            className="mt-7 grid grid-cols-2 gap-3"
            role="group"
            aria-label="Telas públicas do Paroquial"
          >
            {publicScreenshots.map(({ id, Icon, image }) => (
              <button
                key={id}
                type="button"
                aria-pressed={selected === id}
                aria-controls="captura-publica-selecionada"
                onClick={() => setSelected(id)}
                className={`inline-flex min-h-14 items-center gap-3 rounded-xl px-4 py-3 text-base font-bold transition-colors ${selected === id ? "bg-ink text-white" : "bg-selection/50 text-ink hover:bg-selection"}`}
              >
                <Icon
                  size={20}
                  className={selected === id ? "text-accent" : "text-primary"}
                  aria-hidden="true"
                />
                {image.label}
              </button>
            ))}
          </div>
          <p
            className="mt-5 min-h-24 max-w-[43ch] text-base leading-7 text-muted"
            aria-live="polite"
          >
            {screen.description}
          </p>
          <button
            type="button"
            onClick={() => open(screen.image)}
            className="inline-flex min-h-11 items-center gap-2 text-base font-bold text-primary"
          >
            <ZoomIn size={19} aria-hidden="true" />
            Ver captura em tamanho maior
            <ArrowRight size={17} aria-hidden="true" />
          </button>
          <p className="mt-3 text-sm leading-6 text-muted">
            Capturas do ambiente de demonstração, com a interface real do
            aplicativo.
          </p>
        </div>
        <div
          id="captura-publica-selecionada"
          className="relative isolate min-w-0 overflow-hidden rounded-[32px] bg-linear-to-br from-selection via-canvas to-accent/60 px-5 py-7 sm:py-10"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 bottom-16 -z-10 h-52 rounded-full bg-primary/10 blur-3xl"
          />
          <div
            key={screen.id}
            className="mx-auto max-w-[280px] motion-safe:animate-landing-enter"
          >
            <ScreenshotButton screenshot={screen.image} animated />
          </div>
          <p className="mt-6 text-center text-sm font-semibold text-muted">
            {screen.image.label} · visualização no celular
          </p>
        </div>
      </div>
    </section>
  );
}

export function LandingDesktopScreenshots() {
  const [selected, setSelected] = useState<"inicio" | "agenda">("inicio");
  const screenshot = selected === "inicio" ? homeDesktop : agendaDesktop;
  return (
    <div className="min-w-0">
      <div
        role="group"
        aria-label="Capturas no computador"
        className="mb-4 flex flex-wrap gap-2"
      >
        <button
          type="button"
          onClick={() => setSelected("inicio")}
          aria-pressed={selected === "inicio"}
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${selected === "inicio" ? "bg-accent text-accent-ink" : "bg-white/10 text-white hover:bg-white/20"}`}
        >
          <House size={16} aria-hidden="true" />
          Início
        </button>
        <button
          type="button"
          onClick={() => setSelected("agenda")}
          aria-pressed={selected === "agenda"}
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${selected === "agenda" ? "bg-accent text-accent-ink" : "bg-white/10 text-white hover:bg-white/20"}`}
        >
          <CalendarDays size={16} aria-hidden="true" />
          Agenda
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl bg-surface text-ink shadow-[0_24px_60px_-20px_rgb(0_0_0/0.5)]">
        <div className="flex items-center gap-2 border-b border-line bg-canvas px-4 py-3 text-sm font-bold">
          <Monitor size={16} className="text-primary" aria-hidden="true" />
          Site público no computador
        </div>
        <div key={selected} className="motion-safe:animate-landing-enter">
          <ScreenshotButton
            screenshot={screenshot}
            className="rounded-none shadow-none"
          />
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/80">
        A mesma paróquia, em uma composição própria para telas maiores.
      </p>
    </div>
  );
}
