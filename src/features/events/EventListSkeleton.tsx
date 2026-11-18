import { EventList } from "./EventList";

export function EventListSkeleton({ count = 3, label = "Carregando eventos..." }: { count?: number; label?: string }) {
  return (
    <div aria-label={label} role="status">
      <EventList>
        {Array.from({ length: count }, (_, index) => (
          <li key={index} aria-hidden="true">
            <div className="grid min-h-22 animate-pulse grid-cols-[3.25rem_minmax(0,1fr)_1rem] gap-3 px-3 py-4 motion-reduce:animate-none sm:gap-4 sm:px-4">
              <span className="mt-1 h-4 w-10 rounded bg-selection" />
              <span>
                <span className="block h-4 w-3/5 rounded bg-selection" />
                <span className="mt-3 block h-4 w-2/5 rounded bg-selection" />
              </span>
            </div>
          </li>
        ))}
      </EventList>
      <span className="sr-only">{label}</span>
    </div>
  );
}
