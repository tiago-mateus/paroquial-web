import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { setupServer } from "msw/node";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { handlers } from "../../mocks/handlers";
import { PublicChurchesPage } from "./PublicChurchesPage";

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

describe("PublicChurchesPage", () => {
  it("mostra os mocks, permite buscar e selecionar uma capela", async () => {
    renderPage("sao-jose");

    expect(await screen.findByText("4 igrejas cadastradas")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver igrejas" }));

    const sheet = screen.getByRole("region", { name: "Lista de igrejas" });
    const search = within(sheet).getByPlaceholderText("Buscar igreja ou endereço");
    expect(search).toHaveFocus();
    fireEvent.change(search, { target: { value: "Fátima" } });

    expect(within(sheet).getByText("1 de 4 igrejas")).toBeInTheDocument();
    fireEvent.click(within(sheet).getByRole("button", { name: /Capela Nossa Senhora de Fátima/i }));

    expect(screen.queryByRole("region", { name: "Lista de igrejas" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Capela Nossa Senhora de Fátima")).not.toHaveLength(0);
  });

  it("gera um link externo para o local selecionado", async () => {
    renderPage("sao-jose");

    const links = await screen.findAllByRole("link", { name: "Como chegar" });
    expect(links[0]).toHaveAttribute("target", "_blank");
    expect(links[0].getAttribute("href")).toContain("google.com/maps/search");
  });

  it("exibe os estados bloqueado e vazio dos mocks", async () => {
    const blocked = renderPage("nossa-senhora");
    expect(await screen.findByText("Mapa de igrejas indisponível")).toBeInTheDocument();
    blocked.unmount();

    renderPage("sem-igrejas");
    expect(await screen.findByText("Nenhuma igreja cadastrada")).toBeInTheDocument();
  });
});

function renderPage(tenantSlug: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/${tenantSlug}/igrejas`]}>
        <Routes>
          <Route path="/:tenantSlug/igrejas" element={<PublicChurchesPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
