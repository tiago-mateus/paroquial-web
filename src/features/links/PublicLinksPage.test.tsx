import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { handlers } from "../../mocks/handlers";
import { baseUrl } from "../../mocks/utils";
import { PublicLinksPage } from "./PublicLinksPage";
import { getLinkDomain, normalizeLinkUrl } from "./linkPresentation";

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

describe("PublicLinksPage", () => {
  it("exibe somente links ativos, ordenados e com URLs normalizadas", async () => {
    renderPage("sao-jose");

    expect(await screen.findByRole("heading", { name: "Canais de Acesso" })).toBeInTheDocument();
    expect(await screen.findByText("7 links")).toBeInTheDocument();
    expect(screen.getByText("Clique em um dos cards para acessar os canais oficiais da paróquia.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Confissões/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Canal desativado")).not.toBeInTheDocument();

    const links = screen.getAllByRole("link", { name: /^Abrir / });
    expect(links[0]).toHaveAccessibleName("Abrir Site oficial");
    expect(links[0]).toHaveAttribute("href", "https://paroquiasantoantonio.org.br");
    expect(screen.getByRole("link", { name: "Abrir E-mail" })).toHaveAttribute("href", "mailto:secretaria@paroquia.org.br");
    expect(screen.getByRole("link", { name: "Abrir Telefone" })).toHaveAttribute("href", "tel:+551133332211");
  });

  it("registra uma tentativa de clique sem bloquear o destino", async () => {
    let attempts = 0;
    server.use(http.post(`${baseUrl}/api/v1/tenants/:tenantSlug/links/:linkId/click`, () => {
      attempts += 1;
      return new HttpResponse(null, { status: 204 });
    }));
    renderPage("sao-jose");

    const link = await screen.findByRole("link", { name: "Abrir Instagram" });
    fireEvent.click(link);
    expect(link).toHaveAttribute("target", "_blank");
    await waitFor(() => expect(attempts).toBe(1));
  });

  it("exibe estados vazio, erro e paróquia inexistente", async () => {
    const empty = renderPage("nossa-senhora");
    expect(await screen.findByText("Nenhum link disponível no momento.")).toBeInTheDocument();
    empty.unmount();

    const error = renderPage("erro-links");
    expect(await screen.findByText("Não foi possível carregar os links")).toBeInTheDocument();
    error.unmount();

    renderPage("tenant-inexistente");
    expect(await screen.findByText("Paróquia não encontrada")).toBeInTheDocument();
  });
});

describe("linkPresentation", () => {
  it("normaliza protocolos e extrai domínios com segurança", () => {
    expect(normalizeLinkUrl("paroquia.org.br")).toBe("https://paroquia.org.br");
    expect(normalizeLinkUrl("mailto:contato@paroquia.org.br")).toBe("mailto:contato@paroquia.org.br");
    expect(getLinkDomain("https://www.instagram.com/paroquia")).toBe("instagram.com");
    expect(getLinkDomain("tel:+5511999999999")).toBeNull();
  });
});

function renderPage(tenantSlug: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/${tenantSlug}/links`]}>
        <Routes><Route path="/:tenantSlug/links" element={<PublicLinksPage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
