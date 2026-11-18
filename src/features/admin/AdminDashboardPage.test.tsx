import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { setupServer } from "msw/node";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { handlers } from "../../mocks/handlers";
import { AdminDashboardPage } from "./AdminDashboardPage";

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

describe("AdminDashboardPage", () => {
  it("apresenta a programação do dia, a situação da paróquia e as ações principais", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { level: 1, name: "Painel" })).toBeInTheDocument();
    expect(await screen.findByText("Paróquia Santo Antônio de Pádua")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { level: 2, name: "Hoje" })).toBeInTheDocument();
    expect(await screen.findAllByText("Terço dos Homens")).not.toHaveLength(0);
    expect(await screen.findByRole("heading", { level: 2, name: "Situação da paróquia" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Novo evento" })).toHaveAttribute("href", expect.stringContaining("action=new"));
    expect(screen.getByRole("link", { name: "Novo destaque" })).toHaveAttribute("href", "/sao-jose/admin/site/destaques?action=new");
    expect(screen.getByRole("link", { name: "Ver site público" })).toHaveAttribute("href", "/sao-jose");
    expect(screen.getByRole("link", { name: "Situação do site" })).toHaveAttribute("href", "/sao-jose/admin/site/status");
  });
});

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/sao-jose/admin"]}>
        <Routes><Route path="/:tenantSlug/admin" element={<AdminDashboardPage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
