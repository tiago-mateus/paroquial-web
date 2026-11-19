import { MapPin } from "lucide-react";
import type { ReactNode } from "react";
import type { HomeHeaderConfig } from "../api/tenants";
import { classNames } from "../lib/classNames";
import { resolveParishCover } from "../lib/parishCover";
import { CoverImage } from "./CoverImage";
import { SkeletonShape } from "./PublicSkeleton";

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

export function PublicPageCoverSkeleton({ variant = "page" }: { variant?: "home" | "page" }) {
  const home = variant === "home";
  return (
    <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 sm:pt-6">
      <div className={classNames(
        "flex flex-col justify-end rounded-2xl bg-neutral-100 p-5 sm:p-8 lg:p-10",
        home ? "min-h-68 sm:min-h-80" : "min-h-40 sm:min-h-64",
      )}>
        <SkeletonShape className="h-7 w-3/4 max-w-md rounded-md sm:h-10" />
        <SkeletonShape className="mt-3 h-4 w-1/2 max-w-48 rounded" />
        {home ? (
          <div className="mt-5 grid max-w-xl grid-cols-2 gap-3">
            {[0, 1].map(item => (
              <div key={item} className="flex min-h-16 items-center gap-2 rounded-xl border border-neutral-200 px-3">
                <SkeletonShape className="size-7 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <SkeletonShape className="h-3 w-4/5 max-w-24 rounded" />
                  <SkeletonShape className="h-2.5 w-3/5 max-w-20 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <SkeletonShape className="mt-3 h-3.5 w-24 rounded" />
        )}
      </div>
    </div>
  );
}
