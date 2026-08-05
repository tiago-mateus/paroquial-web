import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
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

    fireEvent.click(await screen.findByRole("button", { name: "Novo evento" }));

    expect(screen.getByRole("heading", { name: "Novo evento" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Informações principais" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Data e horário" })).toBeInTheDocument();
    expect(await screen.findByRole("option", { name: "Igreja Matriz São José" })).toBeInTheDocument();
    expect(screen.getByText("Resumo")).toBeInTheDocument();
  });

  it("permite iniciar uma cópia a partir da lista administrativa", async () => {
    renderPage();

    const duplicate = await screen.findByRole("button", { name: "Duplicar Terço dos Homens" });
    fireEvent.click(duplicate);

    expect(screen.getByRole("heading", { name: "Duplicar evento" })).toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toHaveValue("Terço dos Homens");
    expect(screen.getByRole("button", { name: "Criar cópia" })).toBeInTheDocument();
  });

  it("expande e recolhe a mesma agenda no mobile", async () => {
    renderPage();

    await screen.findByText("Agenda da comunidade");
    expect(screen.getByRole("listbox", { name: "Dias da semana" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ver mês completo" }));
    expect(screen.getByRole("button", { name: "Recolher" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/sao-jose/admin/calendario"]}>
        <Routes><Route path="/:tenantSlug/admin/calendario" element={<AdminCalendarPage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
