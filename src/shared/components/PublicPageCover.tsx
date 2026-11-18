import { Church, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import type { HomeHeaderConfig } from "../api/tenants";
import { classNames } from "../lib/classNames";
import { resolveParishCover } from "../lib/parishCover";
import { CoverImage } from "./CoverImage";

type PublicPageCoverProps = {
  title: ReactNode;
  titleId?: string;
  description?: string;
  cityLabel?: string | null;
  headerConfig?: HomeHeaderConfig | null;
  fallbackImageUrl?: string | null;
  variant?: "home" | "page";
  preview?: boolean;
  children?: ReactNode;
};

/** Shared public cover; each page keeps its own content and composition. */
export function PublicPageCover({ title, titleId, description, cityLabel, headerConfig, fallbackImageUrl, variant = "page", preview = false, children }: PublicPageCoverProps) {
  const imageUrl = resolveParishCover({ headerConfig, fallbackImageUrl });
  const imageOpacity = Math.min(1, Math.max(0, headerConfig?.imageOpacity ?? 1));
  const size = variant === "home"
    ? preview ? "min-h-72 p-5" : imageUrl ? "min-h-68 p-5 sm:min-h-80 sm:p-8 lg:p-10" : "p-5 sm:p-8 lg:p-10"
    : "min-h-40 p-5 sm:min-h-64 sm:p-8 lg:p-10 text-md";

  return (
    <header className={classNames("mx-auto max-w-6xl", preview ? "" : "px-4 pt-4 sm:px-6 sm:pt-6")}>

      <div className={classNames("relative isolate flex flex-col justify-end overflow-hidden rounded-2xl bg-ink text-surface motion-safe:animate-parish-reveal", size)}>
        {imageUrl ? <CoverImage
          src={imageUrl}
          fallbackSrc={fallbackImageUrl}
          imageOpacity={imageOpacity}
          className="absolute inset-0 -z-20"
          imageClassName="object-[center_55%]"
          overlayClassName={variant === "home" ? "bg-[linear-gradient(90deg,rgb(22_59_49/0.45),transparent_85%),linear-gradient(180deg,transparent_25%,var(--color-ink)_100%)]" : "bg-[linear-gradient(180deg,transparent_25%,var(--color-ink)_100%)]"}
        /> : null}
        <div className="relative min-w-0">
          <span id={titleId} className={classNames("m-0 break-words font-display font-medium leading-[1.08] tracking-tight text-balance", preview ? "text-[32px]" : "max-w-[19ch] text-[30px] sm:text-[44px] lg:text-[54px]", variant === "home" ? "text-[36px]" : "text-md")}>{title}</span>
          {description ? <p className="mb-0 mt-3 max-w-2xl text-base leading-6 text-surface [overflow-wrap:anywhere]">{description}</p> : null}
          {cityLabel?.trim() ? <p className="mb-0 mt-3 flex min-w-0 items-start gap-1.5 text-sm font-medium leading-5 text-white"><MapPin size={15} className="mt-0.5 shrink-0" aria-hidden="true" /><span className="min-w-0 break-words">{cityLabel.trim()}</span></p> : null}
          {children}
        </div>
      </div>
    </header>
  );
}
