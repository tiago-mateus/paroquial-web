import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { setupServer } from "msw/node";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { handlers } from "../../mocks/handlers";
import { AdminChurchesPage } from "./AdminChurchesPage";
import { AdminChannelsPage, AdminHighlightsPage, AdminHomePage } from "./AdminContentPage";
import { AdminParishPage } from "./AdminParishPage";
import { AdminSchedulesPage } from "./AdminSchedulesPage";

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

describe("áreas administrativas públicas", () => {
  it("edita uma igreja e atualiza a lista", async () => {
    renderPage(<AdminChurchesPage />, "/sao-jose/admin/igrejas", "igrejas");
    fireEvent.click(await screen.findByRole("button", { name: /Igreja Matriz São José/ }, { timeout: 3_000 }));
    const name = screen.getByLabelText("Nome");
    fireEvent.change(name, { target: { value: "Igreja Matriz São José - Centro" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByText("Igreja Matriz São José - Centro")).toBeInTheDocument();
  });

  it("gerencia canais ativos e inativos", async () => {
    renderPage(<AdminChannelsPage />, "/sao-jose/admin/site/canais", "site/canais");
    fireEvent.click(await screen.findByRole("button", { name: "Editar canal Canal desativado" }));
    expect(screen.getByLabelText("Visível no site")).not.toBeChecked();
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Canal arquivado" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByText("Canal arquivado")).toBeInTheDocument();
    expect(screen.getByText("Oculto")).toBeInTheDocument();
  });

  it("edita a página inicial sem remover os dados institucionais", async () => {
    renderPage(<AdminHomePage />, "/sao-jose/admin/site/pagina-inicial", "site/pagina-inicial");
    const whatsapp = await screen.findByLabelText("Número do WhatsApp");
    expect(screen.queryByLabelText("Nome do atalho da secretaria")).not.toBeInTheDocument();
    expect(screen.queryByText("Texto de apoio")).not.toBeInTheDocument();
    fireEvent.change(whatsapp, { target: { value: "11988887777" } });
    expect(whatsapp).toHaveValue("(11) 98888-7777");
    fireEvent.submit(document.getElementById("admin-home-form")!);
    expect((await screen.findAllByText("Alterações publicadas", {}, { timeout: 3_000 })).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Paróquia Santo Antônio de Pádua").length).toBeGreaterThan(0);
  });

  it("reordena destaques e valida destinos de canais", async () => {
    const highlights = renderPage(<AdminHighlightsPage />, "/sao-jose/admin/site/destaques", "site/destaques");
    fireEvent.click(await screen.findByRole("button", { name: "Mover Festa do Padroeiro para baixo" }));
    await waitFor(() => expect(screen.getAllByRole("button", { name: /Editar destaque/ })[0]).toHaveAccessibleName(/Campanha do Agasalho/), { timeout: 3_000 });
    highlights.unmount();

    renderPage(<AdminChannelsPage />, "/sao-jose/admin/site/canais", "site/canais");
    fireEvent.click((await screen.findAllByRole("button", { name: "Novo canal" }))[0]);
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Canal inválido" } });
    fireEvent.change(screen.getByLabelText("Destino"), { target: { value: "javascript:alert(1)" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar canal" }));
    expect(screen.getByText("Informe um site, e-mail ou telefone válido.")).toBeInTheDocument();
  });

  it("carrega identidade e horários existentes para edição", async () => {
    const parish = renderPage(<AdminParishPage />, "/sao-jose/admin/paroquia", "paroquia");
    expect(await screen.findByLabelText("Nome oficial")).toHaveValue("Paróquia Santo Antônio de Pádua");
    expect(screen.getByRole("button", { name: /Salvar alterações/ })).toBeInTheDocument();
    parish.unmount();

    renderPage(<AdminSchedulesPage />, "/sao-jose/admin/horarios", "horarios");
    expect(await screen.findByDisplayValue("Quarta a Sexta")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    await waitFor(() => expect(screen.getAllByLabelText("Dias ou período")).toHaveLength(3));
  });

  it("bloqueia o salvamento com telefone ou horário inválido", async () => {
    renderPage(<AdminHomePage />, "/nossa-senhora/admin/site/pagina-inicial", "site/pagina-inicial");
    const whatsapp = await screen.findByLabelText("Número do WhatsApp");
    fireEvent.change(whatsapp, { target: { value: "119" } });
    expect(screen.getByText("Informe um telefone com DDD válido.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeDisabled();

    fireEvent.change(whatsapp, { target: { value: "11999999999" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(screen.getByText("Informe os dias ou o período.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeDisabled();
  });

  it("sincroniza telefone e confissões com as telas especializadas", async () => {
    const home = renderPage(<AdminHomePage />, "/sao-jose/admin/site/pagina-inicial", "site/pagina-inicial");
    fireEvent.change(await screen.findByLabelText("Número do WhatsApp"), { target: { value: "11977776666" } });
    fireEvent.click(screen.getByRole("button", { name: "Remover Quarta a Sexta" }));
    fireEvent.submit(document.getElementById("admin-home-form")!);
    expect((await screen.findAllByText("Alterações publicadas", {}, { timeout: 3_000 })).length).toBeGreaterThan(0);
    home.unmount();

    const parish = renderPage(<AdminParishPage />, "/sao-jose/admin/paroquia", "paroquia");
    expect(await screen.findByLabelText("Telefone ou WhatsApp")).toHaveValue("(11) 97777-6666");
    parish.unmount();

    renderPage(<AdminSchedulesPage />, "/sao-jose/admin/horarios", "horarios");
    expect(await screen.findByDisplayValue("Sabado")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Quarta a Sexta")).not.toBeInTheDocument();
  });
});

function renderPage(element: React.ReactNode, path: string, route: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={[path]}><Routes><Route path={`/:tenantSlug/admin/${route}`} element={element} /></Routes></MemoryRouter></QueryClientProvider>);
}
