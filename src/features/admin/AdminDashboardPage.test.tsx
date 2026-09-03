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
  it("apresenta dados reais e acessos administrativos", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "Paróquia Santo Antônio de Pádua" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Programação de hoje" })).toBeInTheDocument();
    expect(await screen.findAllByText("Terço dos Homens")).not.toHaveLength(0);
    expect(screen.getByRole("link", { name: "Criar evento hoje" })).toHaveAttribute("href", expect.stringContaining("action=new"));
    expect(screen.getByRole("link", { name: "Ver site público" })).toHaveAttribute("href", "/sao-jose");
    expect(screen.getByRole("link", { name: /Revisar horários/ })).toHaveAttribute("href", "/sao-jose/admin/horarios");
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
