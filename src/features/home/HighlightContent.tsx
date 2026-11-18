import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import type { PublicHomeBanner } from "../../shared/api/banners";

export const DEFAULT_HIGHLIGHT_BACKGROUND = "linear-gradient(135deg, #f59e0b, #b45309)";

/** Shared composition keeps the editor, gallery and published highlight in sync. */
export function HighlightContent({ banner, variant = "public" }: { banner: PublicHomeBanner; variant?: "public" | "gallery" | "compact" }) {
  const href = banner.link?.trim();
  const image = banner.bgImg?.trim();
  const background = banner.bgColor?.trim() || DEFAULT_HIGHLIGHT_BACKGROUND;
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const showImage = Boolean(image && image !== failedImage);
  // The amber preset contains a light stop; only that text region needs shading.
  const amber = background === DEFAULT_HIGHLIGHT_BACKGROUND;

  const compact = variant === "compact";
  return <div className={`relative isolate flex min-w-0 flex-1 flex-col justify-end overflow-hidden bg-primary text-white ${showImage && !compact ? "aspect-[16/10] min-h-min" : ""}`} style={{ background }}>
    {showImage ? <img key={image} src={image} alt="" onError={() => setFailedImage(image ?? null)} className="absolute inset-0 h-full w-full object-cover" /> : null}
    <div className={`relative min-w-0 p-4 ${showImage ? "mt-auto bg-linear-to-t from-black/85 to-black/55" : amber ? "bg-black/35" : ""}`}>
      {showImage ? <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-full h-8 bg-linear-to-t from-black/55 to-transparent" /> : null}
      <h3 className={`m-0 break-words font-display font-medium leading-tight text-white ${compact ? "text-2xl" : "text-[28px]"}`}>{banner.titulo}</h3>
      {banner.mensagem ? <p className={`mb-0 mt-2 break-words whitespace-pre-line text-white ${compact ? "text-sm leading-5" : "text-base leading-6"}`}>{banner.mensagem}</p> : null}
      {href && variant !== "gallery" ? <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Saiba mais sobre ${banner.titulo} (abre em nova aba)`} className={`${compact ? "mt-0" : "mt-2"} inline-flex min-h-11 items-center gap-1.5 self-start rounded-lg text-sm font-bold text-white hover:underline focus-visible:outline-2 focus-visible:outline-white`}>Saiba mais<ArrowUpRight size={15} aria-hidden="true" /></a> : null}
    </div>
  </div>;
}
