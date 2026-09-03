import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import type { CalendarEvent } from "../../shared/api/events";
import { getTenantEvents } from "../../shared/api/events";
import { getTenant } from "../../shared/api/tenants";
import { ErrorState } from "../../shared/components/PageState";
import { PublicDesktopNavigation } from "../../shared/components/PublicNavigation";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";
import { AgendaDayTimeline } from "./AgendaDayTimeline";
import { AgendaEventDetails } from "./AgendaEventDetails";
import { Agenda } from "./components/Agenda";
import { CalendarMobileHeader } from "./components/CalendarMobileHeader";
import {
  endOfMonth,
  formatSelectedDate,
  getEventsForDate,
  isSameDay,
  parseDateKey,
  startOfMonth,
  toDateKey,
} from "./calendar.utils";

export function PublicCalendarPage() {
  const { tenantSlug = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const today = useMemo(() => new Date(), []);
  const dateParam = searchParams.get("date");
  const selectedDate = parseDateKey(dateParam) ?? today;
  const displayedMonth = startOfMonth(selectedDate);
  const monthStart = toDateKey(displayedMonth);
  const monthEnd = toDateKey(endOfMonth(displayedMonth));
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isMonthExpanded, setIsMonthExpanded] = useState(false);
  const tenantQuery = useQuery({ queryKey: ["tenant", tenantSlug], queryFn: () => getTenant(tenantSlug), enabled: Boolean(tenantSlug) });
  useDocumentTitle("Agenda", tenantQuery.data?.name);

  useEffect(() => {
    if (dateParam === toDateKey(selectedDate)) return;
    setSearchParams({ date: toDateKey(selectedDate) }, { replace: true });
  }, [dateParam, selectedDate, setSearchParams]);

  const eventsQuery = useQuery({
    queryKey: ["events", tenantSlug, monthStart, monthEnd],
    queryFn: () => getTenantEvents(tenantSlug, monthStart, monthEnd),
    enabled: Boolean(tenantSlug),
    placeholderData: (previousData) => previousData,
  });

  const events = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);
  const selectedEvents = useMemo(() => getEventsForDate(events, selectedDate), [events, selectedDate]);

  const selectDate = (date: Date) => setSearchParams({ date: toDateKey(date) });
  const closeDetails = useCallback(() => setSelectedEvent(null), []);
  const isTodaySelected = isSameDay(selectedDate, today);

  return (
    <main className="min-h-dvh max-w-none bg-white p-0 text-slate-950 md:bg-stone-50">
      <header className="hidden border-b border-slate-200/70 bg-white md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-amber-100 text-amber-800"><CalendarDays size={19} /></span>
            <div className="min-w-0">
              <p className="m-0 truncate text-[0.65rem] font-bold text-amber-700">{tenantQuery.data?.name ?? "Paroquial"}</p>
              <h1 className="m-0 text-xl font-bold leading-tight">Agenda</h1>
            </div>
          </div>
          <PublicDesktopNavigation tenantSlug={tenantSlug} />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] pt-4 sm:px-6 md:gap-5 md:py-5 lg:px-8 lg:py-7">
        <section className="-mx-4 grid gap-0 border-b border-slate-100 px-4 pb-0 sm:-mx-6 sm:px-6 md:mx-0 md:gap-4 md:border-0 md:px-0 md:pb-0" aria-label="Navegação da agenda">
          <CalendarMobileHeader
            selectedDate={selectedDate}
            selectedEvents={selectedEvents}
            isTodaySelected={isTodaySelected}
            onToday={() => selectDate(today)}
          />
          <div className="md:hidden">
            <Agenda
              events={events}
              selectedDate={selectedDate}
              view={isMonthExpanded ? "month" : "week"}
              onSelectDate={selectDate}
              onViewChange={(view) => setIsMonthExpanded(view === "month")}
            />
          </div>
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[21rem_minmax(0,1fr)]">
          <Agenda
            events={events}
            selectedDate={selectedDate}
            view="month"
            onSelectDate={selectDate}
            className="hidden md:block"
          />

          <section className="grid min-w-0 gap-2" aria-labelledby="selected-date-title">
            <div className="flex items-end justify-between gap-3 px-1">
              <div>
                <p className="m-0 text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-slate-400 md:text-amber-700">Programação do dia</p>
                <h2 id="selected-date-title" className="mb-0 mt-1 hidden text-[1.35rem] font-bold leading-tight md:block">{formatSelectedDate(selectedDate)}</h2>
              </div>
              {eventsQuery.isFetching && !eventsQuery.isLoading ? <span className="text-xs font-semibold text-slate-400">Atualizando...</span> : null}
            </div>

            {eventsQuery.isLoading ? (
              <AgendaSkeleton />
            ) : eventsQuery.isError ? (
              <ErrorState
                title="Não foi possível carregar a agenda"
                description="Verifique sua conexão e tente novamente."
                action={
                  <button type="button" onClick={() => eventsQuery.refetch()} className="rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800">
                    Tentar novamente
                  </button>
                }
              />
            ) : (
              <AgendaDayTimeline events={selectedEvents} onSelect={setSelectedEvent} />
            )}
          </section>
        </div>
      </div>

      <AgendaEventDetails event={selectedEvent} onClose={closeDetails} />
    </main>
  );
}

function AgendaSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white px-4" aria-label="Carregando eventos">
      {[0, 1, 2].map((item) => (
        <div key={item} className="grid min-h-20 animate-pulse grid-cols-[2.5rem_3.5rem_1px_minmax(0,1fr)] gap-2 py-4 sm:grid-cols-[3rem_4rem_1px_minmax(0,1fr)] sm:gap-3">
          <span className="mx-auto mt-1 h-3.5 w-3.5 rounded-full bg-slate-100" />
          <span className="mt-1 h-4 w-10 rounded bg-slate-100" />
          <span className="h-full w-px bg-slate-100" />
          <span><span className="block h-4 w-2/5 rounded bg-slate-100" /><span className="mt-2 block h-3 w-1/3 rounded bg-slate-100" /></span>
        </div>
      ))}
      <span className="sr-only" role="status">Carregando eventos...</span>
    </div>
  );
}
