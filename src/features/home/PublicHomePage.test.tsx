import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { setupServer } from "msw/node";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PublicLayout } from "../../app/routes";
import { handlers } from "../../mocks/handlers";
import { PublicHomePage } from "./PublicHomePage";

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

describe("PublicHomePage", () => {
  it("apresenta a paróquia, agenda, destaques e navegação pública", async () => {
    renderHome("/sao-jose");

    expect(await screen.findByRole("heading", { name: "Paróquia Santo Antônio de Pádua", level: 1 })).toBeInTheDocument();
    expect(await screen.findByText("Agenda de hoje")).toBeInTheDocument();
    expect(await screen.findByText("Evangelho do Dia")).toBeInTheDocument();
    expect(await screen.findAllByText("Santa Missa")).not.toHaveLength(0);
    expect(screen.getByRole("navigation", { name: "Navegação principal da paróquia" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Secretaria/i })).toHaveAttribute("href", "https://wa.me/11999999999");
  });

  it("abre os horários de confissão a partir do hero", async () => {
    renderHome("/sao-jose");

    fireEvent.click(await screen.findByRole("button", { name: /Confissoes/i }));

    expect(screen.getByRole("dialog", { name: "Horários de confissões" })).toBeInTheDocument();
    expect(screen.getByText("Quarta a Sexta")).toBeInTheDocument();
  });

  it("mostra um estado claro quando a paróquia não existe", async () => {
    renderHome("/paroquia-inexistente");

    expect(await screen.findByText("Paróquia não encontrada")).toBeInTheDocument();
  });
});

function renderHome(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/:tenantSlug" element={<PublicLayout />}>
            <Route index element={<PublicHomePage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
