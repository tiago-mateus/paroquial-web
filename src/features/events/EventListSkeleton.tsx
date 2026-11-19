import { EventList } from "./EventList";
import { SkeletonShape, SkeletonStatus } from "../../shared/components/PublicSkeleton";

type EventListPlaceholderProps = { count: number; variant: "default" | "home" };

export function EventListSkeleton({ count = 3, label = "Carregando eventos…", variant = "default" }: Partial<EventListPlaceholderProps> & { label?: string }) {
  return (
    <SkeletonStatus label={label}><EventListPlaceholder count={count} variant={variant} /></SkeletonStatus>
  );
}

export function EventListPlaceholder({ count, variant }: EventListPlaceholderProps) {
  const home = variant === "home";
  const row = home
    ? "grid-cols-[3.75rem_minmax(0,1fr)_1.125rem] px-4 py-3 sm:px-5"
    : "grid-cols-[3.25rem_minmax(0,1fr)_1rem] px-3 py-4 sm:px-4";

  return (
    <div className={home ? "overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50" : undefined}>
      <EventList variant={variant}>
        {Array.from({ length: count }, (_, index) => (
          <li key={index}>
            <div className={`grid min-h-22 items-start gap-3 sm:gap-4 ${row}`}>
              <SkeletonShape className="h-9 w-full rounded-lg" />
              <div className="min-w-0 space-y-2.5 pt-1">
                <SkeletonShape className={`h-4 max-w-64 rounded ${index % 2 ? "w-2/3" : "w-4/5"}`} />
                <SkeletonShape className="h-3 w-2/5 max-w-36 rounded" />
              </div>
              <SkeletonShape className="mt-2 size-3 rounded" />
            </div>
          </li>
        ))}
      </EventList>
    </div>
  );
}
