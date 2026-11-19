import { ArrowUpRight, BookOpen, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { PublicHomeBanner } from "../../shared/api/banners";
import type { LiturgicalReading } from "../../shared/api/liturgy";
import { HighlightContent } from "./HighlightContent";
import { IconButton } from "../../shared/components/IconButton";
import { SectionHeading } from "../../shared/components/SectionHeading";
import { SkeletonShape } from "../../shared/components/PublicSkeleton";

const ROTATION_INTERVAL = 6000;

export function HomeHighlights({ banners, bannersLoading = false, reading, readingStatus = "ready", includeLiturgy = false, titleId = "home-highlights-title", action }: {
  banners: PublicHomeBanner[];
  bannersLoading?: boolean;
  reading?: LiturgicalReading;
  readingStatus?: "loading" | "error" | "ready";
  includeLiturgy?: boolean;
  titleId?: string;
  action?: ReactNode;
}) {
  const slides = [
    ...(includeLiturgy ? [{ id: "daily-liturgy", titulo: "Evangelho do Dia", content: <DailyLiturgyContent reading={reading} status={readingStatus} /> }] : []),
    ...banners.map((banner) => ({ id: `banner-${banner.id}`, titulo: banner.titulo, content: <HighlightContent banner={banner} variant="compact" /> })),
  ];
  const trackRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const activeIndex = Math.min(currentIndex, Math.max(0, slides.length - 1));

  const goToSlide = useCallback((index: number, instant = false) => {
    if (!slides.length) return;
    const targetIndex = (index + slides.length) % slides.length;
    const track = trackRef.current;
    const slide = track?.children[targetIndex] as HTMLElement | undefined;
    if (!track || !slide) return;
    setCurrentIndex(targetIndex);
    track.scrollTo?.({
      left: track.scrollLeft + slide.getBoundingClientRect().left - track.getBoundingClientRect().left,
      behavior: instant || window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }, [slides.length]);

  useEffect(() => {
    if (paused || hovered || slides.length < 2) return;
    const timer = window.setInterval(() => {
      if (document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      goToSlide(activeIndex + 1);
    }, ROTATION_INTERVAL);
    return () => window.clearInterval(timer);
  }, [activeIndex, goToSlide, hovered, paused, slides.length]);

  if (!slides.length && !bannersLoading) return null;
  const hasAdjacentSlide = slides.length > 1 || (slides.length > 0 && bannersLoading);
  const slideLayout = `flex min-h-40 min-w-0 shrink-0 snap-start snap-always flex-col overflow-hidden rounded-2xl ${hasAdjacentSlide ? "basis-[92%] sm:basis-3/4 lg:basis-3/5" : "basis-full"}`;

  const selectSlide = (index: number) => {
    setPaused(true);
    goToSlide(index);
  };

  return (
    <section
      className="min-w-0"
      aria-labelledby={titleId}
      aria-roledescription="carrossel"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={(event) => {
        if (!(event.target as HTMLElement).closest("[data-carousel-rotation]")) setPaused(true);
      }}
    >
      <SectionHeading id={titleId} title="Destaques" className="mb-3 flex-wrap items-center gap-y-1" action={action} />
      {bannersLoading ? <span className="sr-only" role="status">Carregando avisos da comunidade…</span> : null}
      <div
        ref={trackRef}
        aria-live={paused ? "polite" : "off"}
        className={`relative flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${slides.length > 1 ? "after:w-[calc(8%-12px)] after:shrink-0 after:content-[''] sm:after:w-[calc(25%-12px)] lg:after:w-[calc(40%-12px)]" : ""}`}
        onPointerDown={() => setPaused(true)}
        onScroll={(event) => {
          const track = event.currentTarget;
          const items = Array.from(track.children).slice(0, slides.length) as HTMLElement[];
          if (!items.length) return;
          const left = track.getBoundingClientRect().left;
          const nearest = items.reduce((closest, slide, index) => Math.abs(slide.getBoundingClientRect().left - left) < Math.abs(items[closest].getBoundingClientRect().left - left) ? index : closest, 0);
          setCurrentIndex(nearest);
        }}
      >
        {slides.map((slide, index) => (
          <article
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} de ${slides.length}: ${slide.titulo}`}
            onFocusCapture={() => goToSlide(index, true)}
            className={`${slideLayout} bg-surface`}
          >
            {slide.content}
          </article>
        ))}
        {bannersLoading ? <div aria-hidden="true" className={slideLayout}><HighlightSkeletonCard /></div> : null}
      </div>
      {slides.length > 1 ? (
        <div className="flex min-h-12 items-center justify-between gap-1">
          <button type="button" data-carousel-rotation aria-label={paused ? "Retomar destaques automáticos" : "Pausar destaques automáticos"} onClick={() => setPaused((value) => !value)} className="grid h-12 w-11 shrink-0 place-items-center rounded-lg text-primary transition-colors hover:bg-selection active:bg-selection focus-visible:outline-2 focus-visible:outline-focus motion-reduce:transition-none">
            {paused ? <Play size={17} aria-hidden="true" /> : <Pause size={17} aria-hidden="true" />}
          </button>
          <div className="flex min-w-0 overflow-x-auto" role="group" aria-label="Escolher destaque">
            {slides.map((slide, index) => (
              <button key={slide.id} type="button" aria-label={`Exibir destaque ${index + 1}: ${slide.titulo}`} aria-current={index === activeIndex ? "true" : undefined} onClick={() => selectSlide(index)} className="grid h-12 w-11 shrink-0 place-items-center rounded-lg transition-colors hover:bg-selection/60 active:bg-selection focus-visible:outline-2 focus-visible:outline-focus motion-reduce:transition-none">
                <span aria-hidden="true" className={`h-1.5 rounded-full transition-colors motion-reduce:transition-none ${index === activeIndex ? "w-4 bg-primary" : "w-1.5 bg-muted"}`} />
              </button>
            ))}
          </div>
          <div className="flex shrink-0">
            <IconButton label="Exibir destaque anterior" onClick={() => selectSlide(activeIndex - 1)} icon={ChevronLeft} tone="primary" className="h-12 transition-colors active:bg-selection motion-reduce:transition-none" />
            <IconButton label="Exibir próximo destaque" onClick={() => selectSlide(activeIndex + 1)} icon={ChevronRight} tone="primary" className="h-12 transition-colors active:bg-selection motion-reduce:transition-none" />
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function HighlightSkeletonCard() {
  return (
    <div className="flex min-h-40 flex-1 flex-col justify-end gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      <SkeletonShape className="h-6 w-2/3 max-w-60 rounded-md" />
      <SkeletonShape className="h-3.5 w-4/5 max-w-80 rounded" />
      <SkeletonShape className="mb-2 h-3.5 w-2/5 max-w-36 rounded" />
    </div>
  );
}

function DailyLiturgyContent({ reading, status }: { reading?: LiturgicalReading; status: "loading" | "error" | "ready" }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col justify-center bg-selection p-4">
      <div className="flex items-center gap-2.5">
        <BookOpen size={21} className="shrink-0 text-primary" aria-hidden="true" />
        <h3 className="m-0 font-display text-2xl font-medium leading-tight text-ink">Evangelho do Dia</h3>
      </div>
      <p role={status === "loading" || status === "error" ? "status" : undefined} className="mb-0 mt-2 text-sm font-semibold leading-5 text-ink">{status === "loading" ? "Consultando a leitura de hoje…" : status === "error" ? "A leitura de hoje está indisponível." : reading?.referencia || "A Palavra de hoje"}</p>
      {reading?.liturgia ? <p className="m-0 text-sm leading-5 text-muted">{reading.liturgia}</p> : null}
      <a href="https://liturgiadiaria.edicoescnbb.com.br" target="_blank" rel="noopener noreferrer" aria-label="Ler evangelho no site da CNBB (abre em nova aba)" className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-lg text-sm font-bold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-focus">
        Ler no site da CNBB<ArrowUpRight size={15} aria-hidden="true" />
      </a>
    </div>
  );
}
