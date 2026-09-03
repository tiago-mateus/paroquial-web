import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type { CalendarEvent, CreateEventRequest } from '../../shared/api/events';
import {
  createEvent,
  deleteEvent,
  getAdminTenantEvents,
  updateEvent,
} from '../../shared/api/events';
import { getTenantChurches } from '../../shared/api/churches';
import { ErrorState } from '../../shared/components/PageState';
import { Agenda } from './components/Agenda';
import { AdminCalendarHeader } from './admin/components/AdminCalendarHeader';
import { AdminCalendarNavigator } from './admin/components/AdminCalendarNavigator';
import { AdminEventFilters } from './admin/components/AdminEventFilters';
import { AdminEventList, AdminEventListSkeleton } from './admin/components/AdminEventList';
import { AdminSelectedDayHeader } from './admin/components/AdminSelectedDayHeader';
import { AdminMonthSheet } from './admin/components/AdminMonthSheet';
import { AdminEventFormDialog, type EventEditor } from './admin/components/AdminEventFormDialog';
import { DeleteEventDialog } from './admin/components/DeleteEventDialog';
import {
  endOfMonth,
  getEventsForDate,
  isSameDay,
  parseDateKey,
  startOfMonth,
  toDateKey,
} from './calendar.utils';

export function AdminCalendarPage() {
  const { tenantSlug = '' } = useParams();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const today = useMemo(() => new Date(), []);
  const dateParam = searchParams.get('date');
  const selectedDate = parseDateKey(dateParam) ?? today;
  const displayedMonth = startOfMonth(selectedDate);
  const monthStart = toDateKey(displayedMonth);
  const monthEnd = toDateKey(endOfMonth(displayedMonth));
  const [monthSheetOpen, setMonthSheetOpen] = useState(false);
  const [editor, setEditor] = useState<EventEditor | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<CalendarEvent | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [eventActionsOpen, setEventActionsOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const actionParam = searchParams.get('action');
  const handledActionRef = useRef<string | null>(null);
  const mobileCreateButtonRef = useRef<HTMLButtonElement>(null);
  const restoreMobileCreateFocusRef = useRef(false);

  useEffect(() => {
    if (dateParam === toDateKey(selectedDate)) return;
    setSearchParams({ date: toDateKey(selectedDate) }, { replace: true });
  }, [dateParam, selectedDate, setSearchParams]);

  useEffect(() => {
    if (actionParam !== 'new') return;
    const actionKey = `${actionParam}:${dateParam ?? ''}`;
    if (handledActionRef.current === actionKey) return;
    handledActionRef.current = actionKey;
    setEditor({ kind: 'create', date: parseDateKey(dateParam) ?? today });
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('action');
    setSearchParams(nextParams, { replace: true });
  }, [actionParam, dateParam, searchParams, setSearchParams, today]);

  const eventsQuery = useQuery({
    queryKey: ['admin', 'events', tenantSlug, monthStart, monthEnd],
    queryFn: () => getAdminTenantEvents(tenantSlug, monthStart, monthEnd),
    enabled: Boolean(tenantSlug),
    placeholderData: (previous) => previous,
  });
  const churchesQuery = useQuery({
    queryKey: ['churches', tenantSlug],
    queryFn: () => getTenantChurches(tenantSlug),
    enabled: Boolean(tenantSlug),
    retry: false,
  });
  const refreshEvents = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'events', tenantSlug] }),
      queryClient.invalidateQueries({ queryKey: ['events', tenantSlug] }),
    ]);
  }, [queryClient, tenantSlug]);
  const createMutation = useMutation({
    mutationFn: (input: CreateEventRequest) => createEvent(tenantSlug, input),
    onSuccess: refreshEvents,
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateEventRequest }) =>
      updateEvent(tenantSlug, id, input),
    onSuccess: refreshEvents,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEvent(tenantSlug, id),
    onSuccess: refreshEvents,
  });

  const events = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);
  const selectedEvents = useMemo(
    () => getEventsForDate(events, selectedDate),
    [events, selectedDate],
  );
  const filteredEvents = useMemo(
    () =>
      selectedEvents.filter((event) => {
        const matchesType = typeFilter === 'all' || event.type === typeFilter;
        const term = search.trim().toLocaleLowerCase('pt-BR');
        const matchesSearch =
          !term ||
          [event.title, event.location, event.description].some((value) =>
            value?.toLocaleLowerCase('pt-BR').includes(term),
          );
        return matchesType && matchesSearch;
      }),
    [search, selectedEvents, typeFilter],
  );
  const selectDate = (date: Date) => setSearchParams({ date: toDateKey(date) });
  const openCreate = () => setEditor({ kind: 'create', date: selectedDate });
  const openMobileCreate = () => {
    restoreMobileCreateFocusRef.current = true;
    openCreate();
  };
  const openDuplicate = (event: CalendarEvent) =>
    setEditor({ kind: 'create', date: selectedDate, source: event });
  const mutationError = createMutation.error ?? updateMutation.error;
  const isFiltered = Boolean(search.trim()) || typeFilter !== 'all';
  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
  };
  const closeMonthSheet = useCallback(() => setMonthSheetOpen(false), []);

  function changeMobilePeriod(amount: number) {
    selectDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + amount * 7));
  }

  useEffect(() => {
    if (editor || !restoreMobileCreateFocusRef.current) return;
    mobileCreateButtonRef.current?.focus();
    restoreMobileCreateFocusRef.current = false;
  }, [editor]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function saveEvent(input: CreateEventRequest) {
    if (!editor) return;
    if (editor.kind === 'create') {
      await createMutation.mutateAsync(input);
      setNotice('Evento criado com sucesso.');
    } else {
      await updateMutation.mutateAsync({ id: editor.event.sourceId || editor.event.id, input });
      setNotice('Alterações salvas com sucesso.');
    }
    setEditor(null);
  }
  async function confirmDelete() {
    if (!deleteCandidate) return;
    await deleteMutation.mutateAsync(deleteCandidate.sourceId || deleteCandidate.id);
    setNotice('Evento excluído com sucesso.');
    setDeleteCandidate(null);
    setEditor(null);
  }

  return (
    <section className="min-h-dvh min-w-0 max-w-full overflow-x-clip bg-stone-50 text-slate-950">
      <AdminCalendarHeader
        publicHref={`/${tenantSlug}/calendario?date=${toDateKey(selectedDate)}`}
        isFiltered={isFiltered}
        onCreate={openCreate}
        onOpenFilters={() => setFiltersOpen(true)}
      />

      <AdminCalendarNavigator
        events={events}
        selectedDate={selectedDate}
        onSelectDate={selectDate}
        onChangePeriod={changeMobilePeriod}
        onOpenMonth={() => setMonthSheetOpen(true)}
      />

      <div className="mx-auto min-w-0 max-w-7xl pb-28 md:px-6 md:py-6 md:pb-6 lg:px-8 lg:py-6">
        <div className="grid items-start gap-4 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-6">
          <Agenda
            events={events}
            selectedDate={selectedDate}
            view="month"
            onSelectDate={selectDate}
            onToday={() => selectDate(today)}
            isToday={isSameDay(selectedDate, today)}
            selectionTone="amber"
            className="hidden lg:block"
          />
          <section className="grid min-w-0 gap-0 overflow-hidden border-y border-slate-200 bg-white pb-2 md:rounded-2xl md:border md:pb-0" aria-labelledby="admin-selected-date-title">
            <AdminSelectedDayHeader date={selectedDate} eventCount={selectedEvents.length} />
            <div>
              <AdminEventFilters
                search={search}
                type={typeFilter}
                mobileOpen={filtersOpen}
                isFiltered={isFiltered}
                onSearchChange={setSearch}
                onTypeChange={setTypeFilter}
                onClear={clearFilters}
                onCloseMobile={() => setFiltersOpen(false)}
              />
            </div>

            {eventsQuery.isLoading ? (
              <AdminEventListSkeleton />
            ) : eventsQuery.isError ? (
              <ErrorState
                title="Não foi possível carregar a agenda"
                description="Verifique sua conexão e tente novamente."
                action={
                  <button
                    type="button"
                    onClick={() => eventsQuery.refetch()}
                    className="h-11 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white"
                  >
                    Tentar novamente
                  </button>
                }
              />
            ) : (
              <AdminEventList
                events={filteredEvents}
                onEdit={(event) => setEditor({ kind: 'edit', event })}
                onDuplicate={openDuplicate}
                onDelete={setDeleteCandidate}
                onCreate={openCreate}
                isFiltered={isFiltered}
                onClearFilters={clearFilters}
                onActionDialogChange={setEventActionsOpen}
              />
            )}
          </section>
        </div>
      </div>

      {!editor && !deleteCandidate && !filtersOpen && !eventActionsOpen && !monthSheetOpen ? (
        <button
          ref={mobileCreateButtonRef}
          type="button"
          data-testid="mobile-create-event"
          onClick={openMobileCreate}
          aria-label="Novo evento"
          className="fixed inset-x-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-40 inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white shadow-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 active:scale-[0.99] md:hidden"
        >
          <Plus size={18} /> Novo evento
        </button>
      ) : null}

      <AdminMonthSheet
        open={monthSheetOpen}
        events={events}
        selectedDate={selectedDate}
        onSelectDate={selectDate}
        onToday={() => selectDate(today)}
        onClose={closeMonthSheet}
      />

      <AdminEventFormDialog
        editor={editor}
        churches={churchesQuery.data ?? []}
        pending={createMutation.isPending || updateMutation.isPending}
        error={mutationError instanceof Error ? mutationError.message : undefined}
        onClose={() => setEditor(null)}
        onSubmit={saveEvent}
        onDelete={() => editor?.kind === 'edit' && setDeleteCandidate(editor.event)}
      />
      <DeleteEventDialog
        event={deleteCandidate}
        pending={deleteMutation.isPending}
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={() => void confirmDelete()}
      />
      {notice ? (
        <div
          role="status"
          className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] left-1/2 z-[70] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-xl md:bottom-4"
        >
          <CheckCircle2 size={18} className="text-amber-400" />
          {notice}
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Fechar mensagem"
            className="ml-2 grid h-11 w-11 place-items-center rounded-lg text-slate-300 hover:bg-white/10"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}
    </section>
  );
}
