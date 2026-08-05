import { ArrowUpRight, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import type { PublicHomeBanner } from "../../shared/api/banners";
import { classNames } from "../../shared/lib/classNames";

const AUTOPLAY_DELAY_MS = 10_000;
const AUTOPLAY_RESUME_DELAY_MS = 15_000;
const SWIPE_THRESHOLD_PX = 42;

type LiturgicalReading = {
  referencia?: string | null;
  cor?: string | null;
  liturgia?: string | null;
} | null;

type Slide = { type: "evangelho"; data: NonNullable<LiturgicalReading> } | { type: "banner"; data: PublicHomeBanner };

export function HomeBannerCarousel({
  banners,
  evangelho = null,
}: {
  banners?: PublicHomeBanner[];
  evangelho?: LiturgicalReading;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const pointerStartX = useRef<number | null>(null);
  const autoplayResumeTimer = useRef<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const slides = useMemo<Slide[]>(
    () => [
      ...(evangelho ? [{ type: "evangelho" as const, data: evangelho }] : []),
      ...(banners ?? []).map((banner) => ({ type: "banner" as const, data: banner })),
    ],
    [banners, evangelho],
  );

  useEffect(() => {
    setCurrentIndex((index) => (slides.length ? Math.min(index, slides.length - 1) : 0));
  }, [slides.length]);

  useEffect(() => {
    const handleVisibilityChange = () => setIsDocumentVisible(document.visibilityState === "visible");
    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (slides.length <= 1 || isInteracting || isManuallyPaused || prefersReducedMotion || !isDocumentVisible) return;
    const interval = window.setInterval(() => {
      setCurrentIndex((index) => (index + 1) % slides.length);
    }, AUTOPLAY_DELAY_MS);
    return () => window.clearInterval(interval);
  }, [isDocumentVisible, isInteracting, isManuallyPaused, prefersReducedMotion, slides.length]);

  useEffect(() => () => {
    if (autoplayResumeTimer.current !== null) window.clearTimeout(autoplayResumeTimer.current);
  }, []);

  if (!slides.length) return null;

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    pauseAutoplayTemporarily();
  };
  const goToPreviousSlide = () => {
    setCurrentIndex((index) => (index - 1 + slides.length) % slides.length);
    pauseAutoplayTemporarily();
  };
  const goToNextSlide = () => {
    setCurrentIndex((index) => (index + 1) % slides.length);
    pauseAutoplayTemporarily();
  };

  function pauseAutoplayTemporarily() {
    setIsManuallyPaused(true);
    if (autoplayResumeTimer.current !== null) window.clearTimeout(autoplayResumeTimer.current);
    autoplayResumeTimer.current = window.setTimeout(() => {
      setIsManuallyPaused(false);
      autoplayResumeTimer.current = null;
    }, AUTOPLAY_RESUME_DELAY_MS);
  }

  return (
    <section
      className="group/carousel relative min-h-44 touch-pan-y overflow-hidden rounded-2xl border border-black/5 bg-slate-900 shadow-[0_3px_14px_rgb(15_23_42/0.06)]"
      aria-label="Destaques da comunidade"
      aria-roledescription="carrossel"
      onBlur={() => setIsInteracting(false)}
      onFocus={() => setIsInteracting(true)}
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
      onPointerDown={(event) => {
        pointerStartX.current = event.clientX;
      }}
      onPointerCancel={() => {
        pointerStartX.current = null;
      }}
      onPointerUp={(event) => {
        if (pointerStartX.current === null || slides.length <= 1) return;
        const deltaX = event.clientX - pointerStartX.current;
        pointerStartX.current = null;

        if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
        if (deltaX > 0) goToPreviousSlide();
        else goToNextSlide();
      }}
    >
      <div
        className={classNames(
          "flex",
          prefersReducedMotion ? "" : "transition-transform duration-[420ms] ease-in-out",
        )}
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide, index) =>
          slide.type === "evangelho" ? (
            <EvangelhoSlide
              key="evangelho"
              evangelho={slide.data}
              isActive={currentIndex === index}
              position={index + 1}
              total={slides.length}
            />
          ) : (
            <BannerSlide
              key={slide.data.id}
              banner={slide.data}
              isActive={currentIndex === index}
              position={index + 1}
              total={slides.length}
            />
          ),
        )}
      </div>

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            onClick={goToPreviousSlide}
            aria-label="Exibir destaque anterior"
            className="absolute left-3 top-1/2 z-[3] hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/20 text-white opacity-0 backdrop-blur-md transition hover:bg-black/35 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 group-hover/carousel:opacity-100 md:grid"
          >
            <ChevronLeft size={17} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={goToNextSlide}
            aria-label="Exibir próximo destaque"
            className="absolute right-3 top-1/2 z-[3] hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/20 text-white opacity-0 backdrop-blur-md transition hover:bg-black/35 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 group-hover/carousel:opacity-100 md:grid"
          >
            <ChevronRight size={17} aria-hidden="true" />
          </button>

          <div className="absolute bottom-3 right-3 z-[3] flex items-center gap-1.5 rounded-full bg-black/15 py-0.5 pl-2 pr-1 backdrop-blur-sm">
            <span className="text-[0.58rem] font-bold tabular-nums text-white/70" aria-hidden="true">
              {currentIndex + 1}/{slides.length}
            </span>
            <div className="flex items-center gap-0.5">
              {slides.map((slide, index) => (
                <button
                  key={`${slide.type}-${index}`}
                  type="button"
                  className="grid h-5 w-3.5 place-items-center rounded-full bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  onClick={() => goToSlide(index)}
                  aria-label={`Exibir destaque ${index + 1}: ${getSlideLabel(slide)}`}
                  aria-current={currentIndex === index ? "true" : undefined}
                >
                  <span
                    className={classNames(
                      "h-1 rounded-full transition-all duration-200",
                      currentIndex === index ? "w-3 bg-white" : "w-1 bg-white/45",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

type SlideStateProps = {
  isActive: boolean;
  position: number;
  total: number;
};

function EvangelhoSlide({
  evangelho,
  ...slideState
}: { evangelho: NonNullable<LiturgicalReading> } & SlideStateProps) {
  return (
    <SlideFrame
      href="https://liturgiadiaria.edicoescnbb.com.br"
      background={getLiturgicalGradient(evangelho.cor ?? "")}
      label="Evangelho do Dia"
      actionLabel="Ler liturgia"
      {...slideState}
    >
      <span className="relative z-[1] mb-2 inline-flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.15em] text-white/70">
        <BookOpen size={12} strokeWidth={1.8} /> Liturgia do dia
      </span>
      <strong className="relative z-[1] line-clamp-2 max-w-[82%] text-[1.05rem] font-bold leading-tight tracking-[-0.01em] text-white">
        Evangelho do Dia
      </strong>
      {evangelho.referencia ? (
        <small className="relative z-[1] mt-1 line-clamp-2 max-w-[82%] text-[0.82rem] font-medium leading-snug text-white/80">
          {evangelho.referencia}
        </small>
      ) : null}
      {evangelho.liturgia ? (
        <small className="relative z-[1] mt-2 line-clamp-1 max-w-[82%] text-[0.7rem] font-medium text-white/60">
          {evangelho.liturgia}
        </small>
      ) : null}
    </SlideFrame>
  );
}

function BannerSlide({ banner, ...slideState }: { banner: PublicHomeBanner } & SlideStateProps) {
  return (
    <SlideFrame
      href={banner.link}
      background={banner.bgColor?.trim() || "linear-gradient(135deg, #f59e0b, #b45309)"}
      imageUrl={banner.bgImg}
      label={banner.titulo}
      actionLabel="Abrir destaque"
      {...slideState}
    >
      <span className="relative z-[1] mb-2 text-[0.62rem] font-bold uppercase tracking-[0.15em] text-white/70">
        {formatBannerType(banner.tipo)}
      </span>
      <strong className="relative z-[1] line-clamp-2 max-w-[82%] text-[1.05rem] font-bold leading-tight tracking-[-0.01em] text-white">
        {banner.titulo}
      </strong>
      {banner.mensagem ? (
        <small className="relative z-[1] mt-1.5 line-clamp-2 max-w-[82%] text-[0.82rem] font-medium leading-snug text-white/75">
          {banner.mensagem}
        </small>
      ) : null}
    </SlideFrame>
  );
}

function SlideFrame({
  href,
  background,
  imageUrl,
  label,
  actionLabel,
  isActive,
  position,
  total,
  children,
}: {
  href?: string | null;
  background: string;
  imageUrl?: string | null;
  label: string;
  actionLabel: string;
  isActive: boolean;
  position: number;
  total: number;
  children: ReactNode;
}) {
  const content = (
    <>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-50 transition-transform duration-500 group-hover:scale-[1.02]"
        />
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgb(0_0_0_/_0.08),rgb(0_0_0_/_0.08)_34%,rgb(0_0_0_/_0.72))]" />
      {href ? (
        <span className="absolute right-3 top-3 z-[2] inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 text-[0.65rem] font-bold text-white backdrop-blur-md transition-colors duration-200 group-hover:bg-white/20">
          <span className="hidden sm:inline">{actionLabel}</span>
          <ArrowUpRight aria-hidden="true" size={15} />
        </span>
      ) : null}
      {children}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label}, destaque ${position} de ${total} (abre em nova aba)`}
        aria-hidden={!isActive}
        aria-roledescription="slide"
        tabIndex={isActive ? 0 : -1}
        className="group relative flex min-h-44 flex-[0_0_100%] flex-col justify-end overflow-hidden px-5 pb-4 pt-14 text-white outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/80"
        style={{ background }}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      aria-label={label}
      aria-hidden={!isActive}
      className="group relative flex min-h-44 flex-[0_0_100%] flex-col justify-end overflow-hidden px-5 pb-4 pt-14 text-white"
      role="group"
      aria-roledescription="slide"
      style={{ background }}
    >
      {content}
    </div>
  );
}

function getSlideLabel(slide: Slide) {
  return slide.type === "evangelho" ? "Evangelho do Dia" : slide.data.titulo;
}

function formatBannerType(type?: string | null) {
  const normalized = type?.trim();
  if (!normalized) return "Destaque";

  return normalized.charAt(0).toLocaleUpperCase("pt-BR") + normalized.slice(1).toLocaleLowerCase("pt-BR");
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

function getLiturgicalGradient(cor: string) {
  switch (cor) {
    case "Verde":
      return "linear-gradient(135deg, #15803d, #14532d)";
    case "Roxo":
      return "linear-gradient(135deg, #6d28d9, #4c1d95)";
    case "Vermelho":
      return "linear-gradient(135deg, #b91c1c, #7f1d1d)";
    case "Branco":
      return "linear-gradient(135deg, #b7791f, #78350f)";
    default:
      return "linear-gradient(135deg, #475569, #1f2937)";
  }
}
