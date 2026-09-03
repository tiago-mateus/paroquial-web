import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { setupServer } from "msw/node";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { handlers } from "../../mocks/handlers";
import { AdminCalendarPage } from "./AdminCalendarPage";

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

describe("AdminCalendarPage", () => {
  it("abre o formulário organizado com as igrejas cadastradas", async () => {
    renderPage();

    const mobileCreate = await screen.findByTestId("mobile-create-event");
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
    expect(screen.getByRole("radio", { name: "Missa" })).toBeChecked();
    fireEvent.click(closeLocation);

    const submit = screen.getByRole("button", { name: "Criar evento" });
    const close = screen.getByRole("button", { name: "Fechar formulário" });
    submit.focus();
    fireEvent.keyDown(submit, { key: "Tab" });
    expect(close).toHaveFocus();
    fireEvent.click(close);
    expect(await screen.findByTestId("mobile-create-event")).toHaveFocus();
  });

  it("abre um novo evento a partir da ação informada na URL", async () => {
    renderPage("/sao-jose/admin/calendario?date=2026-08-06&action=new");

    expect(await screen.findByRole("heading", { name: "Novo evento" })).toBeInTheDocument();
    expect(screen.getByLabelText("Data")).toHaveValue("2026-08-06");
  });

  it("permite iniciar uma cópia a partir da lista administrativa", async () => {
    renderPage();

    const duplicate = await screen.findByRole("button", { name: "Duplicar Terço dos Homens" });
    fireEvent.click(duplicate);

    expect(screen.getByRole("heading", { name: "Duplicar evento" })).toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toHaveValue("Terço dos Homens");
    expect(screen.getByRole("button", { name: "Criar cópia" })).toBeInTheDocument();
  });

  it("expõe edição e exclusão diretamente em cada evento", async () => {
    renderPage();

    const editButtons = await screen.findAllByRole("button", { name: "Editar Santa Missa" });
    fireEvent.click(editButtons[0]);
    expect(screen.getByRole("heading", { name: "Editar evento" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Fechar formulário" }));

    const deleteButtons = await screen.findAllByRole("button", { name: "Excluir Santa Missa" });
    fireEvent.click(deleteButtons[0]);
    const deleteDialog = screen.getByRole("alertdialog", { name: "Excluir evento?" });
    expect(deleteDialog).toBeInTheDocument();
    expect(screen.getByText(/Esta ação não poderá ser desfeita/i)).toBeInTheDocument();
    const confirmDelete = within(deleteDialog).getByRole("button", { name: "Excluir" });
    const closeDelete = within(deleteDialog).getByRole("button", { name: "Fechar confirmação" });
    confirmDelete.focus();
    fireEvent.keyDown(confirmDelete, { key: "Tab" });
    expect(closeDelete).toHaveFocus();
  });

  it("abre o calendário mensal em bottom sheet e mantém a navegação acessível", async () => {
    renderPage();

    const week = screen.getByRole("listbox", { name: "Dias da semana" });
    expect(week).toBeInTheDocument();
    const selectedDay = within(week).getByRole("option", { selected: true });
    selectedDay.focus();
    fireEvent.keyDown(selectedDay, { key: "ArrowRight" });
    expect(within(week).getByRole("option", { selected: true })).toHaveFocus();

    const monthButton = screen.getByRole("button", { name: "Abrir calendário mensal" });
    monthButton.focus();
    fireEvent.click(monthButton);
    const monthDialog = screen.getByRole("dialog", { name: "Calendário mensal" });
    expect(monthDialog).toBeInTheDocument();
    expect(within(monthDialog).getByRole("button", { name: "Fechar calendário mensal" })).toHaveFocus();
    const monthGrids = screen.getAllByRole("grid", { name: "Calendário mensal" });
    expect(monthGrids).toHaveLength(2);
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
    const filterInput = within(filterDialog).getByRole("textbox", { name: "Buscar eventos" });
    expect(filterInput).toHaveFocus();
    const closeFilters = within(filterDialog).getByRole("button", { name: "Fechar filtros" });
    const applyFilters = within(filterDialog).getByRole("button", { name: "Ver resultados" });
    applyFilters.focus();
    fireEvent.keyDown(applyFilters, { key: "Tab" });
    expect(closeFilters).toHaveFocus();
  });

  it("abre apenas um painel de ações por vez no mobile", async () => {
    renderPage();

    const openRowActions = await screen.findAllByRole("button", {
      name: "Abrir ações de Santa Missa",
    });
    fireEvent.click(openRowActions[0]);
    expect(screen.getByRole("dialog", { name: "Santa Missa" })).toBeInTheDocument();
    expect(screen.queryByTestId("mobile-create-event")).not.toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });

    const actionButtons = await screen.findAllByRole("button", { name: "Ações de Santa Missa" });
    fireEvent.click(actionButtons[0]);

    const actionDialog = screen.getByRole("dialog", { name: "Santa Missa" });
    expect(actionDialog).toBeInTheDocument();
    expect(within(actionDialog).getByRole("button", { name: "Editar Santa Missa" })).toBeInTheDocument();
    const closeActions = within(actionDialog).getByRole("button", { name: "Fechar ações" });
    const deleteAction = within(actionDialog).getByRole("button", { name: "Excluir Santa Missa" });
    deleteAction.focus();
    fireEvent.keyDown(deleteAction, { key: "Tab" });
    expect(closeActions).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Santa Missa" })).not.toBeInTheDocument();
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
