import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { setupServer } from "msw/node";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { handlers } from "../../mocks/handlers";
import { AdminCalendarPage } from "./AdminCalendarPage";

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => { server.resetHandlers(); vi.restoreAllMocks(); });

describe("AdminCalendarPage", () => {
  it('leva ao dia escolhido sem repetir a rolagem ao buscar eventos', async () => {
    server.use(http.get('*/api/v1/admin/tenants/:tenant/events', () => HttpResponse.json([
      { id: 'monday', sourceId: 'monday', occurrenceId: 'monday', tenantSlug: 'sao-jose', title: 'Evento de segunda', start: '2026-08-03T09:00:00', type: 'missa', repeat: 'none', repeatWeekdays: [] },
      { id: 'sunday', sourceId: 'sunday', occurrenceId: 'sunday', tenantSlug: 'sao-jose', title: 'Evento de domingo', start: '2026-08-09T09:00:00', type: 'missa', repeat: 'none', repeatWeekdays: [] },
    ])));
    const previous = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');
    const targets: HTMLElement[] = [];
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: function(this: HTMLElement) { targets.push(this); } });
    try {
      renderPage('/sao-jose/admin/calendario?date=2026-08-03');
      await screen.findByRole('button', { name: 'Editar Evento de domingo' });
      expect(targets).toHaveLength(0);
      const miniCalendar = screen.getByRole('complementary', { name: 'Consulta de datas' });
      fireEvent.click(within(miniCalendar).getByRole('gridcell', { name: /domingo, 9 de agosto de 2026/i }));
      await waitFor(() => expect(targets.at(-1)).toHaveAttribute('data-program-date', '2026-08-09'));
      expect(targets).toHaveLength(1);
      fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar eventos neste mês' }), { target: { value: 'segunda' } });
      expect(screen.getByText('Nenhum evento nesta data com os filtros aplicados.')).toBeInTheDocument();
      expect(targets).toHaveLength(1);
      fireEvent.click(screen.getByRole('button', { name: 'Novo evento' }));
      expect(screen.getByLabelText('Data')).toHaveValue('2026-08-09');
    } finally {
      if (previous) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', previous);
      else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
    }
  });

  it('não foca automaticamente o local personalizado ao abrir uma edição mobile', async () => {
    const matchMedia = window.matchMedia;
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({ ...matchMedia(query), matches: query === '(max-width: 767px)' }));
    server.use(http.get('*/api/v1/admin/tenants/:tenant/events', () => HttpResponse.json([
      { id: 'custom', sourceId: 'custom', occurrenceId: 'custom', tenantSlug: 'sao-jose', title: 'Encontro no salão', location: 'Salão da comunidade', start: '2026-08-03T09:00:00', type: 'encontro', repeat: 'none', repeatWeekdays: [] },
    ])));
    renderPage('/sao-jose/admin/calendario?date=2026-08-03');
    const edit = await screen.findByRole('button', { name: 'Editar Encontro no salão' });
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    fireEvent.click(edit);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Fechar formulário' })).toHaveFocus());
    const location = screen.getByLabelText('Nome do local');
    expect(location).toHaveValue('Salão da comunidade');
    expect(focus.mock.contexts).not.toContain(location);
  });

  it('atualiza a mesma notificação após excluir', async () => {
    server.use(http.delete('*/api/v1/admin/tenants/:tenant/events/:id', () => new HttpResponse(null, { status: 204 })));
    vi.spyOn(toast, 'loading').mockReturnValue('delete-toast');
    const success = vi.spyOn(toast, 'success').mockReturnValue('delete-toast');
    renderPage();
    fireEvent.click((await screen.findAllByRole('button', { name: 'Mais ações: Terço dos Homens' }))[0]);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Excluir Terço dos Homens' }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Excluir' }));
    await waitFor(() => expect(success).toHaveBeenCalledWith('Evento excluído', expect.objectContaining({ id: 'delete-toast', description: 'Terço dos Homens' })));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('mostra o erro e mantém a confirmação para tentar novamente', async () => {
    server.use(http.delete('*/api/v1/admin/tenants/:tenant/events/:id', () => HttpResponse.json({ message: 'Falha' }, { status: 500 })));
    vi.spyOn(toast, 'loading').mockReturnValue('failed-delete');
    const dismiss = vi.spyOn(toast, 'dismiss');
    renderPage();
    fireEvent.click((await screen.findAllByRole('button', { name: 'Mais ações: Terço dos Homens' }))[0]);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Excluir Terço dos Homens' }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Excluir' }));
    await screen.findByText('Não foi possível excluir. Tente novamente.');
    expect(dismiss).toHaveBeenCalledWith('failed-delete');
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Excluir' })).toBeEnabled();
  });

  it("abre o formulário organizado com as igrejas cadastradas", async () => {
    renderPage();

    const mobileCreate = await screen.findByRole("button", { name: "Novo evento" });
    expect(mobileCreate).toHaveAccessibleName("Novo evento");
    mobileCreate.focus();
    fireEvent.click(mobileCreate);

    const formDialog = screen.getByRole("dialog", { name: "Novo evento" });
    await waitFor(() =>
      expect(formDialog).toContainElement(document.activeElement as HTMLElement),
    );
    expect(screen.getByRole("heading", { name: "Informações principais" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Data e horário" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Igreja ou espaço: Local a definir" }));
    const locationDialog = screen.getByRole("dialog", { name: "Igreja ou espaço" });
    expect(await within(locationDialog).findByRole("option", { name: "Igreja Matriz São José" })).toBeInTheDocument();
    const lastLocationOption = within(
      within(locationDialog).getByRole("option", { name: "Outro local..." }),
    ).getByRole("button");
    const closeLocation = within(locationDialog).getByRole("button", { name: "Fechar" });
    lastLocationOption.focus();
    fireEvent.keyDown(lastLocationOption, { key: "Tab" });
    expect(closeLocation).toHaveFocus();
    expect(within(formDialog).getByRole("combobox", { name: "Tipo" })).toHaveValue("missa");
    fireEvent.click(closeLocation);

    const submit = screen.getByRole("button", { name: "Criar evento" });
    const close = screen.getByRole("button", { name: "Fechar formulário" });
    submit.focus();
    fireEvent.keyDown(submit, { key: "Tab" });
    expect(close).toHaveFocus();
    fireEvent.click(close);
    expect(await screen.findByRole("button", { name: "Novo evento" })).toHaveFocus();
  });

  it("abre um novo evento a partir da ação informada na URL", async () => {
    renderPage("/sao-jose/admin/calendario?date=2026-08-06&action=new");

    expect(await screen.findByRole("heading", { name: "Novo evento" })).toBeInTheDocument();
    expect(screen.getByLabelText("Data")).toHaveValue("2026-08-06");
  });

  it("mantém o rascunho do evento quando o fechamento é cancelado", async () => {
    renderPage("/sao-jose/admin/calendario?date=2026-08-06&action=new");
    const title = await screen.findByLabelText("Título");
    fireEvent.change(title, { target: { value: "Celebração de teste" } });
    fireEvent.click(screen.getByRole("button", { name: "Fechar formulário" }));
    expect(title).toHaveValue("Celebração de teste");
    fireEvent.click(within(screen.getByRole("alertdialog", { name: "Descartar alterações?" })).getByRole("button", { name: "Continuar editando" }));
    expect(title).toHaveValue("Celebração de teste");
    fireEvent.click(screen.getByRole("button", { name: "Fechar formulário" }));
    fireEvent.click(within(screen.getByRole("alertdialog", { name: "Descartar alterações?" })).getByRole("button", { name: "Descartar e sair" }));
    expect(screen.queryByRole("dialog", { name: "Novo evento" })).not.toBeInTheDocument();
  });

  it("permite iniciar uma cópia a partir da lista administrativa", async () => {
    renderPage();

    fireEvent.click((await screen.findAllByRole("button", { name: "Mais ações: Terço dos Homens" }))[0]);
    fireEvent.click(screen.getByRole("menuitem", { name: "Duplicar Terço dos Homens" }));

    expect(screen.getByRole("heading", { name: "Duplicar evento" })).toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toHaveValue("Terço dos Homens");
    expect(screen.getByRole("button", { name: "Criar cópia" })).toBeInTheDocument();
  });

  it("mantém edição visível e exclusão no menu do evento", async () => {
    renderPage();

    const editButtons = await screen.findAllByRole("button", { name: "Editar Santa Missa" });
    fireEvent.click(editButtons[0]);
    expect(screen.getByRole("heading", { name: "Editar evento" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Fechar formulário" }));

    fireEvent.click((await screen.findAllByRole("button", { name: "Mais ações: Santa Missa" }))[0]);
    fireEvent.click(screen.getByRole("menuitem", { name: "Excluir Santa Missa" }));
    const deleteDialog = screen.getByRole("alertdialog", { name: "Excluir evento?" });
    expect(deleteDialog).toBeInTheDocument();
    expect(screen.getByText(/Esta ação não poderá ser desfeita/i)).toBeInTheDocument();
    const confirmDelete = within(deleteDialog).getByRole("button", { name: "Excluir" });
    const closeDelete = within(deleteDialog).getByRole("button", { name: "Cancelar" });
    confirmDelete.focus();
    fireEvent.keyDown(confirmDelete, { key: "Tab" });
    expect(closeDelete).toHaveFocus();
  });

  it("abre o calendário mensal em bottom sheet e mantém a navegação acessível", async () => {
    renderPage("/sao-jose/admin/calendario?date=2026-08-06");

    const miniCalendar = screen.getByRole("complementary", { name: "Consulta de datas" });
    expect(within(miniCalendar).getByRole("gridcell", { selected: true })).toHaveAccessibleName(/quinta-feira, 6 de agosto de 2026/i);
    fireEvent.click(within(miniCalendar).getByRole("gridcell", { name: /sexta-feira, 7 de agosto de 2026/i }));
    expect(within(miniCalendar).getByRole("gridcell", { selected: true })).toHaveAccessibleName(/sexta-feira, 7 de agosto de 2026/i);

    const monthButton = screen.getByRole("button", { name: "Abrir calendário mensal" });
    monthButton.focus();
    fireEvent.click(monthButton);
    const monthDialog = screen.getByRole("dialog", { name: "Calendário mensal" });
    expect(monthDialog).toBeInTheDocument();
    expect(within(monthDialog).getByRole("button", { name: "Fechar calendário mensal" })).toHaveFocus();
    const monthGrids = within(monthDialog).getAllByRole("grid", { name: "Calendário mensal" });
    expect(monthGrids).toHaveLength(1);
    monthGrids.forEach((grid) => expect(within(grid).getAllByRole("row")).toHaveLength(6));

    const selectedMonthDay = within(monthDialog).getByRole("gridcell", { selected: true });
    selectedMonthDay.focus();
    fireEvent.keyDown(selectedMonthDay, { key: "ArrowDown" });
    expect(within(monthDialog).getByRole("gridcell", { selected: true })).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Calendário mensal" })).not.toBeInTheDocument();
    expect(monthButton).toHaveFocus();

    fireEvent.click(monthButton);
    const reopenedMonthDialog = screen.getByRole("dialog", { name: "Calendário mensal" });
    fireEvent.click(within(reopenedMonthDialog).getByRole("gridcell", { selected: true }));
    expect(screen.queryByRole("dialog", { name: "Calendário mensal" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Buscar e filtrar eventos" }));
    const filterDialog = screen.getByRole("dialog", { name: "Buscar e filtrar eventos" });
    expect(filterDialog).toBeInTheDocument();
    const filterInput = within(filterDialog).getByRole("searchbox", { name: "Buscar eventos neste mês" });
    expect(filterInput).toHaveFocus();
    const closeFilters = within(filterDialog).getByRole("button", { name: "Fechar filtros" });
    const applyFilters = within(filterDialog).getByRole("button", { name: /^Ver resultados/ });
    applyFilters.focus();
    fireEvent.keyDown(applyFilters, { key: "Tab" });
    expect(closeFilters).toHaveFocus();
  });

  it("envia repetição semanal com os dias escolhidos e mostra o resumo", async () => {
    let body: Record<string, unknown> | undefined;
    server.use(http.post('*/api/v1/admin/tenants/:tenant/events', async ({ request }) => {
      body = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({ ...body, id: 'new', sourceId: 'new', occurrenceId: 'new', tenantSlug: 'sao-jose', repeatWeekdays: body.repeatWeekdays ?? [] }, { status: 201 });
    }));
    renderPage("/sao-jose/admin/calendario?date=2026-08-05&action=new");
    fireEvent.change(await screen.findByLabelText("Título"), { target: { value: "Grupo de oração" } });
    fireEvent.click(screen.getByRole("radio", { name: "Semanal" }));
    // 05/08/2026 é quarta-feira: já vem marcada.
    expect(screen.getByRole("checkbox", { name: "quarta-feira" })).toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "sexta-feira" }));
    fireEvent.change(screen.getByLabelText("Repetir até"), { target: { value: "2026-08-31" } });
    expect(screen.getByTestId("recurrence-summary")).toHaveTextContent("Repete às quartas e sextas às 18:00, até 31/08/2026 (8 ocorrências).");

    fireEvent.click(screen.getByRole("button", { name: "Criar evento" }));
    await waitFor(() => expect(body).toBeDefined());
    expect(body).toMatchObject({ title: "Grupo de oração", repeat: "weekly", repeatWeekdays: [3, 5], repeatUntil: "2026-08-31", start: "2026-08-05T18:00:00", end: "2026-08-05T19:00:00" });
  });

  it("exige ao menos um dia na repetição semanal", async () => {
    renderPage("/sao-jose/admin/calendario?date=2026-08-05&action=new");
    fireEvent.change(await screen.findByLabelText("Título"), { target: { value: "Grupo de oração" } });
    fireEvent.click(screen.getByRole("radio", { name: "Semanal" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "quarta-feira" }));
    fireEvent.change(screen.getByLabelText("Repetir até"), { target: { value: "2026-08-31" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar evento" }));
    expect(await screen.findByText("Escolha pelo menos um dia.")).toBeInTheDocument();
  });

  it("mantém a duração ao mudar o início", async () => {
    renderPage("/sao-jose/admin/calendario?date=2026-08-05&action=new");
    const start = await screen.findByLabelText("Início");
    fireEvent.change(start, { target: { value: "19:30" } });
    expect(screen.getByLabelText(/Término/)).toHaveValue("20:30");
    expect(screen.getByText("Duração: 1h")).toBeInTheDocument();
  });

  it("mostra erros de validação do servidor junto ao campo e mantém o rascunho", async () => {
    server.use(http.post('*/api/v1/admin/tenants/:tenant/events', () =>
      HttpResponse.json({ code: 'VALIDATION_ERROR', message: 'Dados inválidos', fields: { title: ['Título já usado nesta data.'] } }, { status: 422 })));
    vi.spyOn(toast, 'error').mockReturnValue('x');
    renderPage("/sao-jose/admin/calendario?date=2026-08-05&action=new");
    const title = await screen.findByLabelText("Título");
    fireEvent.change(title, { target: { value: "Missa repetida" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar evento" }));
    expect(await screen.findByText("Título já usado nesta data.")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Revise os campos indicados");
    expect(title).toHaveValue("Missa repetida");
  });

  it("só habilita salvar a edição depois de uma alteração e avisa sobre a série", async () => {
    renderPage();
    fireEvent.click((await screen.findAllByRole("button", { name: "Editar Terço dos Homens" }))[0]);
    const save = screen.getByRole("button", { name: "Salvar alterações" });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Terço dos Homens e Mulheres" } });
    await waitFor(() => expect(save).toBeEnabled());
    expect(screen.queryByText("Este evento se repete.")).not.toBeInTheDocument();
  });

  it("mantém editar visível e duplicar nas ações do mesmo evento", async () => {
    renderPage();

    const edit = await screen.findAllByRole("button", { name: "Editar Santa Missa" });
    const more = within(edit[0].closest("article")!).getByRole("button", { name: "Mais ações: Santa Missa" });
    fireEvent.click(more);
    expect(screen.getByRole("menuitem", { name: "Duplicar Santa Missa" })).toBeInTheDocument();
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Novo evento" })).toBeInTheDocument();
    fireEvent.click(edit[0]);
    expect(screen.getByRole("dialog", { name: "Editar evento" })).toBeInTheDocument();
  });
});

function renderPage(path = "/sao-jose/admin/calendario") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes><Route path="/:tenantSlug/admin/calendario" element={<AdminCalendarPage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
