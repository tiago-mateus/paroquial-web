import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { setupServer } from "msw/node";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { handlers } from "../../mocks/handlers";
import { toDateKey } from "./calendar.utils";
import { PublicCalendarPage } from "./PublicCalendarPage";

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

describe("PublicCalendarPage", () => {
  it("mostra a agenda do dia e abre os detalhes de um evento", async () => {
    renderCalendar();

    expect(await screen.findByRole("heading", { name: "Agenda", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Programação do dia")).toBeInTheDocument();

    const events = await screen.findAllByRole("button", { name: /Santa Missa|Terço dos Homens/i });
    fireEvent.click(events[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fechar detalhes" })).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("permite navegar para o próximo mês", async () => {
    renderCalendar();
    const currentMonth = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date());
    expect(await screen.findAllByText(new RegExp(currentMonth, "i"))).not.toHaveLength(0);

    fireEvent.click(screen.getAllByRole("button", { name: "Próximo mês" })[0]);
    const nextMonth = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
      new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    );
    expect(await screen.findAllByText(new RegExp(nextMonth, "i"))).not.toHaveLength(0);
  });

  it("oferece a semana compacta e permite expandir o mês no mobile", async () => {
    renderCalendar();

    expect(await screen.findByText("Agenda da comunidade")).toBeInTheDocument();
    expect(screen.getByRole("listbox", { name: "Dias da semana" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Semana anterior" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Próxima semana" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Mês anterior" })).not.toHaveLength(0);
    expect(screen.getAllByRole("button", { name: "Próximo mês" })).not.toHaveLength(0);

    const toggle = screen.getByRole("button", { name: "Ver mês completo" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Recolher" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("grid", { name: "Calendário mensal" })).not.toHaveLength(0);
  });
});

function renderCalendar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const path = `/sao-jose/calendario?date=${toDateKey(new Date())}`;

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/:tenantSlug/calendario" element={<PublicCalendarPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
