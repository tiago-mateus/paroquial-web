import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import type { CalendarEvent } from "../../shared/api/events";
import { getTenantEvents } from "../../shared/api/events";
import { usePublicTenant } from "../../shared/hooks/usePublicTenant";
import { EventListSkeleton } from "../events/EventListSkeleton";
import { ErrorState } from "../../shared/components/PageState";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";
import { AgendaDayTimeline } from "./AgendaDayTimeline";
import { AgendaEventDetails } from "./AgendaEventDetails";
import { PublicDatePicker } from "./components/PublicDatePicker";
import {
  endOfMonth,
  getEventsForDate,
  formatSelectedDate,
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
  const [calendarCursor, setCalendarCursor] = useState<{ selectedKey: string; date: Date } | null>(null);
  const displayedDate = calendarCursor?.selectedKey === toDateKey(selectedDate) ? calendarCursor.date : selectedDate;
  const tenantQuery = usePublicTenant(tenantSlug);
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

  const selectDate = (date: Date) => {
    setCalendarCursor(null);
    setSearchParams({ date: toDateKey(date) });
  };
  const closeDetails = useCallback(() => setSelectedEvent(null), []);
  const isTodaySelected = isSameDay(selectedDate, today);

  return (
    <main className="min-h-dvh max-w-none bg-canvas p-0 text-ink">

      <div className="mt-5 mx-auto grid max-w-6xl items-start gap-7 px-5 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:px-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-10">
        <section className="min-w-0 max-[374px]:-mx-5 lg:col-start-2 lg:row-start-1" aria-label="Navegação da agenda">
          <PublicDatePicker tenantSlug={tenantSlug} selectedDate={selectedDate} displayedDate={displayedDate} onSelectDate={selectDate} onNavigateDate={(date) => setCalendarCursor({ selectedKey: toDateKey(selectedDate), date })} />
        </section>

        <section className="grid min-w-0 gap-5 lg:col-start-1 lg:row-start-1" aria-labelledby="selected-date-title" aria-busy={eventsQuery.isFetching}>
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-5">
            <div>
              <h2 id="selected-date-title" className="m-0 font-display text-2xl font-medium leading-tight text-ink sm:text-3xl">{formatSelectedDate(selectedDate)}</h2>
              <p className="mb-0 mt-1 text-[13px] text-muted">{isTodaySelected ? "Hoje · " : ""}{eventsQuery.isLoading ? "Carregando eventos…" : eventsQuery.isError ? "Programação indisponível" : selectedEvents.length === 0 ? "Nenhum evento" : `${selectedEvents.length} ${selectedEvents.length === 1 ? "evento" : "eventos"}`}</p>
            </div>
            {eventsQuery.isFetching && !eventsQuery.isLoading ? <span role="status" className="text-[13px] text-muted">Atualizando…</span> : null}
          </header>
            {eventsQuery.isLoading ? (
              <EventListSkeleton />
            ) : eventsQuery.isError ? (
              <ErrorState
                title="Não foi possível carregar a agenda"
                description="Verifique sua conexão e tente novamente."
                action={
                  <button type="button" onClick={() => eventsQuery.refetch()} className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover">
                    Tentar novamente
                  </button>
                }
              />
            ) : (
              <AgendaDayTimeline events={selectedEvents} onSelect={setSelectedEvent} />
            )}
        </section>
      </div>

      <AgendaEventDetails event={selectedEvent} onClose={closeDetails} locationContext={[tenantQuery.data?.name, tenantQuery.data?.cidade, tenantQuery.data?.estado].filter(Boolean).join(", ")} />
    </main>
  );
}
