import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarPlus,
  CheckCircle2,
  ExternalLink,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import type { CalendarEvent, CreateEventRequest } from '../../shared/api/events';
import {
  createEvent,
  deleteEvent,
  getAdminTenantEvents,
  updateEvent,
} from '../../shared/api/events';
import { getTenantChurches } from '../../shared/api/churches';
import { ErrorState } from '../../shared/components/PageState';
import { AdminPageHeader } from '../admin/AdminPageHeader';
import { AdminDayTimeline } from './AdminDayTimeline';
import { AdminEventFormDialog, type EventEditor } from './AdminEventFormDialog';
import { Agenda } from './components/Agenda';
import { CalendarMobileHeader } from './components/CalendarMobileHeader';
import { DeleteEventDialog } from './DeleteEventDialog';
import {
  endOfMonth,
  formatSelectedDate,
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
  const [isMonthExpanded, setIsMonthExpanded] = useState(false);
  const [editor, setEditor] = useState<EventEditor | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<CalendarEvent | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (dateParam === toDateKey(selectedDate)) return;
    setSearchParams({ date: toDateKey(selectedDate) }, { replace: true });
  }, [dateParam, selectedDate, setSearchParams]);

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
  const isTodaySelected = isSameDay(selectedDate, today);
  const openCreate = () => setEditor({ kind: 'create', date: selectedDate });
  const openDuplicate = (event: CalendarEvent) =>
    setEditor({ kind: 'create', date: selectedDate, source: event });
  const mutationError = createMutation.error ?? updateMutation.error;
  const isFiltered = Boolean(search.trim()) || typeFilter !== 'all';

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
    <section className="min-h-[calc(100dvh-3.5rem)] min-w-0 max-w-full overflow-x-clip bg-white text-slate-950 md:min-h-dvh md:bg-stone-50">
      <AdminPageHeader
        title="Agenda"
        actions={
          <>
            <Link
              to={`/${tenantSlug}/calendario?date=${toDateKey(selectedDate)}`}
              className="hidden h-10 items-center gap-2 rounded-full px-3 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 sm:inline-flex"
            >
              <ExternalLink size={15} /> Ver agenda pública
            </Link>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-slate-950 px-4 py-0 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-[0.98]"
            >
              <CalendarPlus size={16} /> Novo evento
            </button>
          </>
        }
      />

      <div className="mx-auto grid min-w-0 max-w-7xl gap-4 px-4 py-4 sm:px-6 md:gap-5 md:py-5 lg:px-8 lg:py-7">
        <section
          className="-mx-4 grid gap-0 border-b border-slate-100 bg-white px-4 pb-0 sm:-mx-6 sm:px-6 md:mx-0 md:gap-4 md:border-0 md:px-0 md:pb-0"
          aria-label="Navegação da agenda"
        >
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
              view={isMonthExpanded ? 'month' : 'week'}
              onSelectDate={selectDate}
              onViewChange={(view) => setIsMonthExpanded(view === 'month')}
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
          <section className="grid min-w-0 gap-3" aria-labelledby="admin-selected-date-title">
            <div className="hidden items-end justify-between gap-3 px-1 md:flex">
              <div>
                <p className="m-0 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-amber-700">
                  {selectedEvents.length} {selectedEvents.length === 1 ? 'evento' : 'eventos'}
                </p>
                <h2
                  id="admin-selected-date-title"
                  className="mb-0 mt-1 text-[1.35rem] font-bold capitalize leading-tight"
                >
                  {formatSelectedDate(selectedDate)}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                {eventsQuery.isFetching && !eventsQuery.isLoading ? (
                  <span className="text-xs font-semibold text-slate-400">Atualizando...</span>
                ) : null}
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-3.5 text-xs font-bold text-white transition hover:bg-slate-800"
                >
                  <CalendarPlus size={15} /> Evento
                </button>
              </div>
            </div>
            {eventsQuery.isLoading ? (
              <AgendaSkeleton />
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
              <AdminDayTimeline
                events={filteredEvents}
                onSelect={(event) => setEditor({ kind: 'edit', event })}
                onDuplicate={openDuplicate}
                onCreate={openCreate}
                isFiltered={isFiltered}
                onClearFilters={() => {
                  setSearch('');
                  setTypeFilter('all');
                }}
              />
            )}
          </section>
        </div>
      </div>

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
          className="fixed bottom-4 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-xl"
        >
          <CheckCircle2 size={18} className="text-amber-400" />
          {notice}
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Fechar mensagem"
            className="ml-2 grid h-7 w-7 place-items-center rounded-lg text-slate-300 hover:bg-white/10"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}
    </section>
  );
}

function AgendaSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white px-4"
      aria-label="Carregando eventos"
    >
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="grid min-h-20 animate-pulse grid-cols-[2.5rem_3.5rem_1px_minmax(0,1fr)] gap-2 py-4"
        >
          <span className="mx-auto mt-1 h-3.5 w-3.5 rounded-full bg-slate-100" />
          <span className="mt-1 h-4 w-10 rounded bg-slate-100" />
          <span className="h-full w-px bg-slate-100" />
          <span>
            <span className="block h-4 w-2/5 rounded bg-slate-100" />
            <span className="mt-2 block h-3 w-1/3 rounded bg-slate-100" />
          </span>
        </div>
      ))}
      <span className="sr-only" role="status">
        Carregando eventos...
      </span>
    </div>
  );
}
