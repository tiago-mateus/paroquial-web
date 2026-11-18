import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import { AdminCalendarHeader } from './admin/components/AdminCalendarHeader';
import { AdminCalendarNavigator } from './admin/components/AdminCalendarNavigator';
import { AdminEventFilters } from './admin/components/AdminEventFilters';
import { eventTypeOptions, parseCalendarView, type CalendarViewMode } from './admin/calendarAdmin.constants';
import { AdminEventListSkeleton } from './admin/components/AdminEventList';
import { AdminListView } from './admin/components/AdminListView';
import { AdminMonthSheet } from './admin/components/AdminMonthSheet';
import { AdminMonthView } from './admin/components/AdminMonthView';
import { AdminWeekBoard } from './admin/components/AdminWeekBoard';
import { Agenda } from './components/Agenda';
import { AdminEventFormDialog, type EventEditor, type EventFormError } from './admin/components/AdminEventFormDialog';
import { DeleteEventDialog } from './admin/components/DeleteEventDialog';
import { AdminPage, AdminPageContent } from '../admin/AdminPage';
import { X } from 'lucide-react';
import {
  addDays,
  getMonthGridBounds,
  getWeekDays,
  parseDateKey,
  shiftMonth,
  startOfMonth,
  toDateKey,
} from './calendar.utils';

export function AdminCalendarPage() {
  const { tenantSlug = '' } = useParams();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const today = useMemo(() => new Date(), []);
  const dateParam = searchParams.get('date');
  const selectedDate = useMemo(() => parseDateKey(dateParam) ?? today, [dateParam, today]);
  // O modo vive na URL (?view=): sobrevive a recarregar, voltar e compartilhar o link.
  const view: CalendarViewMode = parseCalendarView(searchParams.get('view'));
  const [dateNavigation, setDateNavigation] = useState(0);
  const handledDateNavigation = useRef(0);
  const requestedDateKey = useRef<string | null>(null);
  const programRef = useRef<HTMLElement>(null);
  const weekDays = getWeekDays(selectedDate, true);
  // Um único intervalo (a grade completa do mês) cobre mês, semana e lista:
  // trocar de modo reaproveita os mesmos dados, sem nova requisição.
  const gridBounds = getMonthGridBounds(selectedDate);
  const rangeStart = toDateKey(gridBounds.start);
  const rangeEnd = toDateKey(gridBounds.end);
  const monthKey = toDateKey(startOfMonth(selectedDate)).slice(0, 7);
  const [monthSheetOpen, setMonthSheetOpen] = useState(false);
  const [editor, setEditor] = useState<EventEditor | null>(null);
  const [closingDialog, setClosingDialog] = useState(false);
  const dialogContainerRef = useRef<HTMLDivElement>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<CalendarEvent | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [offline, setOffline] = useState(() => !navigator.onLine);
  const actionParam = searchParams.get('action');
  const handledActionRef = useRef<string | null>(null);
  const mobileCreateButtonRef = useRef<HTMLButtonElement>(null);
  const restoreMobileCreateFocusRef = useRef(false);

  useEffect(() => {
    const updateConnection = () => setOffline(!navigator.onLine);
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
    };
  }, []);

  /** Atualiza a URL preservando os demais parâmetros (data, modo, ação). */
  const updateParams = useCallback((changes: Record<string, string>, replace = false) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      Object.entries(changes).forEach(([key, value]) => next.set(key, value));
      return next;
    }, { replace });
  }, [setSearchParams]);

  useEffect(() => {
    if (dateParam === toDateKey(selectedDate)) return;
    updateParams({ date: toDateKey(selectedDate) }, true);
  }, [dateParam, selectedDate, updateParams]);

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
    queryKey: ['admin', 'events', tenantSlug, rangeStart, rangeEnd],
    queryFn: () => getAdminTenantEvents(tenantSlug, rangeStart, rangeEnd),
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

  // Referência estável: evita reiniciar o formulário aberto a cada renderização.
  const churches = useMemo(() => churchesQuery.data ?? [], [churchesQuery.data]);
  const churchesStatus = churchesQuery.isLoading ? 'loading' : churchesQuery.isError ? 'error' : 'ready';
  const resetCreate = createMutation.reset;
  const resetUpdate = updateMutation.reset;
  // Cada abertura do formulário começa sem o erro da tentativa anterior.
  useEffect(() => {
    if (!editor) return;
    resetCreate();
    resetUpdate();
  }, [editor, resetCreate, resetUpdate]);

  const events = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);
  const weekStartKey = toDateKey(weekDays[0]);
  const weekEndKey = toDateKey(weekDays[6]);
  // Cada modo recorta o mesmo conjunto carregado: semana, mês (só dias do mês) ou grade do mês.
  const scopeEvents = useMemo(() => events.filter(event => {
    const key = toDateKey(new Date(event.start));
    if (view === 'week') return key >= weekStartKey && key <= weekEndKey;
    if (view === 'list') return key.startsWith(monthKey);
    return true;
  }), [events, view, weekStartKey, weekEndKey, monthKey]);
  const filteredEvents = useMemo(
    () =>
      scopeEvents.filter((event) => {
        const matchesType = typeFilter === 'all' || event.type === typeFilter;
        const term = search.trim().toLocaleLowerCase('pt-BR');
        const matchesSearch =
          !term ||
          [event.title, event.location, event.description].some((value) =>
            value?.toLocaleLowerCase('pt-BR').includes(term),
          );
        return matchesType && matchesSearch;
      }),
    [search, scopeEvents, typeFilter],
  );
  const selectDate = (date: Date) => {
    requestedDateKey.current = toDateKey(date);
    setDateNavigation((request) => request + 1);
    updateParams({ date: toDateKey(date) });
  };
  const selectedDateKey = toDateKey(selectedDate);
  useEffect(() => {
    // Navigate only after an explicit date choice and after the requested period has loaded.
    // Refetches, edits and filters must not move the person's reading position.
    if (!dateNavigation || handledDateNavigation.current === dateNavigation || requestedDateKey.current !== selectedDateKey || eventsQuery.isFetching || monthSheetOpen) return;
    // Só a lista rola até a data; nos outros modos o pedido é dado como atendido,
    // para não rolar de surpresa quando a pessoa trocar para a lista depois.
    if (view !== 'list') { handledDateNavigation.current = dateNavigation; return; }
    const frame = requestAnimationFrame(() => {
      // A lista só tem dias com evento: vai ao grupo da data ou ao próximo que existir.
      const groups = Array.from(programRef.current?.querySelectorAll<HTMLElement>('[data-program-date]') ?? []);
      const target = groups.find(group => (group.dataset.programDate ?? '') >= selectedDateKey) ?? groups.at(-1) ?? programRef.current;
      if (!target) return;
      target.scrollIntoView?.({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      handledDateNavigation.current = dateNavigation;
    });
    return () => cancelAnimationFrame(frame);
  }, [dateNavigation, selectedDateKey, eventsQuery.isFetching, monthSheetOpen, view]);
  const openCreate = () => setEditor({ kind: 'create', date: selectedDate });
  const openMobileCreate = () => {
    restoreMobileCreateFocusRef.current = true;
    openCreate();
  };
  const openDuplicate = (event: CalendarEvent) =>
    setEditor({ kind: 'create', date: new Date(event.start), source: event });
  // Ações de evento compartilhadas pelos três modos: o fluxo de edição e exclusão é um só.
  const editEvent = (event: CalendarEvent) => setEditor({ kind: 'edit', event });
  const requestDelete = (event: CalendarEvent) => { deleteMutation.reset(); setDeleteCandidate(event); };
  const mutationError = createMutation.error ?? updateMutation.error;
  const formError = useMemo(() => toEventFormError(mutationError), [mutationError]);
  const isFiltered = Boolean(search.trim()) || typeFilter !== 'all';
  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
  };
  const closeMonthSheet = useCallback(() => setMonthSheetOpen(false), []);
  const closeFilters = useCallback(() => setFiltersOpen(false), []);

  /** Anterior/próximo respeita o modo: semana anda 7 dias, mês e lista andam um mês. */
  function changePeriod(amount: number) {
    const next = view === 'week' ? addDays(selectedDate, amount * 7) : shiftMonth(selectedDate, amount);
    updateParams({ date: toDateKey(next) });
  }
  const setView = (mode: CalendarViewMode) => updateParams({ view: mode });
  /** Do mês para a semana daquele dia. */
  const openDayInWeek = (date: Date) => updateParams({ date: toDateKey(date), view: 'week' });

  useEffect(() => {
    if (editor || !restoreMobileCreateFocusRef.current) return;
    mobileCreateButtonRef.current?.focus();
    restoreMobileCreateFocusRef.current = false;
  }, [editor]);

  async function saveEvent(input: CreateEventRequest) {
    if (!editor) return;
    const id = toast.loading('Salvando…');
    try {
      if (editor.kind === 'create') {
        await createMutation.mutateAsync(input);
      } else {
        await updateMutation.mutateAsync({ id: editor.event.sourceId || editor.event.id, input });
      }
      await finishDialog();
      setEditor(null);
      toast.success(editor.kind === 'edit' ? 'Alterações salvas' : editor.source ? 'Evento duplicado' : 'Evento criado', { id, duration: 4000 });
    } catch {
      toast.dismiss(id);
    } finally {
      setClosingDialog(false);
    }
  }
  async function confirmDelete() {
    if (!deleteCandidate) return;
    const id = toast.loading('Excluindo…');
    try {
      await deleteMutation.mutateAsync(deleteCandidate.sourceId || deleteCandidate.id);
      await finishDialog();
      setDeleteCandidate(null);
      setEditor(null);
      toast.success('Evento excluído', { id, description: deleteCandidate.title, duration: 4000 });
    } catch {
      toast.dismiss(id);
    } finally {
      setClosingDialog(false);
    }
  }

  async function finishDialog() {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    setClosingDialog(true);
    const panels = dialogContainerRef.current?.querySelectorAll<HTMLElement>('[role="dialog"], [role="alertdialog"]') ?? [];
    await Promise.all(Array.from(panels, async (panel) => {
      if (!panel.animate) return;
      const animation = panel.animate(
        [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(16px)' }],
        { duration: 180, easing: 'ease-in', fill: 'forwards' },
      );
      const backdrop = panel.parentElement?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' });
      await Promise.all([animation.finished.catch(() => {}), backdrop?.finished.catch(() => {})]);
    }));
  }

  return (
    <AdminPage className="agenda-page bg-canvas max-w-full overflow-x-clip" header={<AdminCalendarHeader
      publicHref={`/${tenantSlug}/calendario?date=${toDateKey(selectedDate)}`}
      onCreate={openMobileCreate}
      createButtonRef={mobileCreateButtonRef}
    />}>
      <AdminPageContent width="wide" className="agenda-page-content max-w-none gap-0 px-4 pb-8 pt-3 md:px-6 md:pt-4 xl:px-8">
        <section aria-labelledby="admin-agenda-period" className="agenda-work-area mx-auto w-full max-w-300 min-w-0">
          {offline ? <p role="status" className="agenda-offline-notice mb-6 border-b border-line py-3 text-base leading-6 text-accent-ink">Você está sem conexão. A programação já carregada continua disponível. Reconecte-se para salvar alterações.</p> : null}
          <AdminCalendarNavigator
            view={view}
            onViewChange={setView}
            selectedDate={selectedDate}
            onToday={() => selectDate(today)}
            onChangePeriod={changePeriod}
            onOpenMonth={() => setMonthSheetOpen(true)}
          />
          {/* Só a lista tem o minicalendário ao lado; mês e semana usam a largura toda. */}
          <div className={`agenda-content-columns mt-3 min-w-0 @4xl/admin:grid @4xl/admin:items-start @4xl/admin:gap-6 ${view === 'list' ? '@4xl/admin:grid-cols-[minmax(0,1fr)_18.5rem]' : 'is-wide-view @4xl/admin:grid-cols-1'}`}>
          <div className="agenda-program-column min-w-0">
          <AdminEventFilters
            inline
            onOpen={() => setFiltersOpen(true)}
            scope={view === 'week' ? 'week' : 'month'}
            search={search}
            type={typeFilter}
            mobileOpen={filtersOpen}
            isFiltered={isFiltered}
            onSearchChange={setSearch}
            onTypeChange={setTypeFilter}
            onClear={clearFilters}
            onCloseMobile={closeFilters}
            resultCount={filteredEvents.length}
          />
          {isFiltered ? <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line py-3" aria-label="Filtros ativos">
            {!eventsQuery.isLoading && !eventsQuery.isError ? <p role="status" className="m-0 text-sm text-muted">{filteredEvents.length} de {scopeEvents.length} eventos</p> : null}
            {typeFilter !== 'all' ? <button type="button" onClick={() => setTypeFilter('all')} aria-label="Remover filtro de tipo" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-muted hover:bg-selection/35">{eventTypeOptions.find(([value]) => value === typeFilter)?.[1]}<X size={15} aria-hidden="true" /></button> : null}
            {search.trim() ? <button type="button" onClick={() => setSearch('')} aria-label="Remover filtro de busca" className="inline-flex min-h-11 min-w-0 max-w-full items-center gap-2 rounded-lg px-2 text-left text-sm text-muted hover:bg-selection/35"><span className="min-w-0 break-words [overflow-wrap:anywhere]">Busca: “{search.trim()}”</span><X size={15} className="shrink-0" aria-hidden="true" /></button> : null}
          </div> : null}
          <section ref={programRef} className="min-w-0 scroll-mt-4" aria-label={view === 'week' ? 'Eventos da semana' : 'Eventos do mês'}>
            {eventsQuery.isLoading ? <AdminEventListSkeleton /> : eventsQuery.isError ? (
              <div role="alert" className="agenda-load-error px-4 py-12 text-center [&_h3]:m-0 [&_h3]:text-lg [&_h3]:font-bold [&_p]:mb-0 [&_p]:mt-2 [&_p]:text-base [&_p]:text-muted"><h3>Não foi possível carregar a agenda</h3><p>Verifique sua conexão e tente novamente.</p><button type="button" onClick={() => eventsQuery.refetch()} className="agenda-empty-action mt-4 min-h-11 rounded-xl border border-line px-4 text-base text-primary hover:bg-selection">Tentar novamente</button></div>
            ) : view === 'week' ? (
              <AdminWeekBoard events={filteredEvents} selectedDate={selectedDate} today={today} isFiltered={isFiltered} onSelectDate={selectDate} onEdit={editEvent} />
            ) : view === 'month' ? (
              <AdminMonthView
                events={filteredEvents}
                selectedDate={selectedDate}
                today={today}
                isFiltered={isFiltered}
                onSelectDay={selectDate}
                onOpenDay={openDayInWeek}
                onEdit={editEvent}
                onDuplicate={openDuplicate}
                onDelete={requestDelete}
                onCreate={openCreate}
                onClearFilters={clearFilters}
              />
            ) : (
              <AdminListView
                events={filteredEvents}
                selectedDate={selectedDate}
                today={today}
                isFiltered={isFiltered}
                onEdit={editEvent}
                onDuplicate={openDuplicate}
                onDelete={requestDelete}
                onCreate={openCreate}
                onClearFilters={clearFilters}
              />
            )}
          </section>
          </div>
          {view === 'list' ? <aside className="agenda-calendar-aside sticky top-4 hidden min-w-0 border-l border-line/60 pl-5 @4xl/admin:block [&>h2]:m-0 [&>h2]:mb-1 [&>h2]:text-xs [&>h2]:font-semibold [&>h2]:uppercase [&>h2]:tracking-[0.06em] [&>h2]:text-muted" aria-label="Consulta de datas">
            <h2>Ir para uma data</h2>
            <Agenda events={events} selectedDate={selectedDate} view="month" onSelectDate={selectDate} selectionTone="blue" plain className="agenda-month-calendar [&>div:first-child]:mb-2 [&>div:first-child]:pb-1 [&_[role=grid]]:bg-transparent [&_[role=gridcell]]:min-h-10 md:[&_[role=gridcell]]:min-h-10 [&_[role=gridcell]]:gap-0.5 [&_[role=gridcell]]:bg-transparent [&_[role=gridcell]>span:first-child]:size-7 [&_[role=gridcell]>span:first-child]:text-sm [&_[role=row]]:gap-0 [&>div:nth-child(2)]:gap-0 [&>div:nth-child(2)_span]:py-1 [&>div:nth-child(2)_span]:text-xs [&>div:nth-child(2)_span]:font-medium [&>div:nth-child(2)_span]:tracking-normal [&>div:nth-child(2)_span]:normal-case [&>div:first-child_strong]:text-sm [&>div:first-child_strong]:font-semibold" />
          </aside> : null}
          </div>
        </section>
      </AdminPageContent>
      <AdminMonthSheet
        open={monthSheetOpen}
        events={events}
        selectedDate={selectedDate}
        onSelectDate={selectDate}
        onToday={() => selectDate(today)}
        onClose={closeMonthSheet}
      />

      <div ref={dialogContainerRef}>
      <AdminEventFormDialog
        editor={editor}
        churches={churches}
        churchesStatus={churchesStatus}
        pending={createMutation.isPending || updateMutation.isPending || closingDialog}
        error={formError}
        onClose={() => setEditor(null)}
        onSubmit={saveEvent}
        onDelete={() => { deleteMutation.reset(); if (editor?.kind === 'edit') setDeleteCandidate(editor.event); }}
      />
      <DeleteEventDialog
        event={deleteCandidate}
        pending={deleteMutation.isPending || closingDialog}
        error={deleteMutation.isError}
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={() => void confirmDelete()}
      />
      </div>
    </AdminPage>
  );
}

/** apiFetch lança o corpo ApiError (objeto simples), não uma instância de Error. */
function toEventFormError(error: unknown): EventFormError | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const { message, fields } = error as { message?: unknown; fields?: unknown };
  return {
    message: typeof message === 'string' ? message : '',
    fields: fields && typeof fields === 'object' ? (fields as Record<string, string[]>) : undefined,
  };
}
