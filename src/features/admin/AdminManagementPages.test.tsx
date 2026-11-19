import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { getTenant } from "../../shared/api/tenants";
import { baseUrl } from "../../mocks/utils";
import { setupServer } from "msw/node";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { handlers } from "../../mocks/handlers";
import { AdminChurchesPage } from "./AdminChurchesPage";
import { AdminChannelsPage, AdminHighlightsPage, AdminHomePage } from "./AdminContentPage";
import { AdminParishPage } from "./AdminParishPage";
import { AdminSchedulesPage } from "./AdminSchedulesPage";

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => { server.resetHandlers(); vi.restoreAllMocks(); });

describe("áreas administrativas públicas", () => {
  it("edita uma igreja e atualiza a lista", async () => {
    renderPage(<AdminChurchesPage />, "/sao-jose/admin/igrejas", "igrejas");
    fireEvent.click(await screen.findByRole("button", { name: /Igreja Matriz São José/ }, { timeout: 3_000 }));
    const name = screen.getByLabelText("Nome");
    fireEvent.change(name, { target: { value: "Igreja Matriz São José - Centro" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByText("Igreja Matriz São José - Centro")).toBeInTheDocument();
  });

  it("busca igrejas pelo endereço e explica quando não há resultado", async () => {
    renderPage(<AdminChurchesPage />, "/sao-jose/admin/paroquia/igrejas", "paroquia/igrejas");
    const search = await screen.findByRole("searchbox", { name: "Buscar igreja ou endereço" });
    await screen.findByRole("button", { name: /Editar Capela Nossa Senhora de Fátima/ });
    fireEvent.change(search, { target: { value: "Ponta da Serra" } });
    expect(screen.getByRole("button", { name: /Editar Capela Nossa Senhora de Fátima/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Editar Igreja Matriz São José/ })).not.toBeInTheDocument();
    fireEvent.change(search, { target: { value: "local inexistente" } });
    expect(screen.getByText("Nenhum local encontrado")).toBeInTheDocument();
  });

  it("gerencia canais ativos e inativos", async () => {
    renderPage(<AdminChannelsPage />, "/sao-jose/admin/site/canais", "site/canais");
    fireEvent.click(await screen.findByRole("button", { name: "Editar canal Canal desativado" }));
    expect(screen.getByLabelText("Visível no site")).not.toBeChecked();
    fireEvent.change(screen.getByLabelText("Nome do canal"), { target: { value: "Canal arquivado" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByRole("button", { name: "Editar canal Canal arquivado" })).toBeInTheDocument();
    expect(screen.getByText("Oculto")).toBeInTheDocument();
  });

  it("protege a edição de canais até que o descarte seja confirmado", async () => {
    renderPage(<AdminChannelsPage />, "/sao-jose/admin/site/canais", "site/canais");
    fireEvent.click(await screen.findByRole("button", { name: "Novo canal" }));
    fireEvent.change(screen.getByLabelText("Nome do canal"), { target: { value: "Rascunho do canal" } });
    fireEvent.click(screen.getByRole("button", { name: "Fechar formulário" }));
    expect(screen.getByRole("dialog", { name: "Novo canal" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continuar editando" }));
    expect(screen.getByLabelText("Nome do canal")).toHaveValue("Rascunho do canal");
    fireEvent.click(screen.getByRole("button", { name: "Fechar formulário" }));
    fireEvent.click(screen.getByRole("button", { name: "Descartar e sair" }));
    expect(screen.queryByRole("dialog", { name: "Novo canal" })).not.toBeInTheDocument();
  });

  it("reordena canais pelas setas do teclado", async () => {
    renderPage(<AdminChannelsPage />, "/sao-jose/admin/site/canais", "site/canais");
    const firstHandle = (await screen.findAllByRole("button", { name: /Arrastar canal .* para reordenar/ }))[0];
    firstHandle.focus();
    fireEvent.keyDown(firstHandle, { key: "ArrowDown" });
    await waitFor(() => expect(screen.getAllByRole("button", { name: /^Editar canal / })[0]).toHaveAccessibleName("Editar canal Site oficial"));
  });

  it("edita a capa sem alterar telefone ou horários", async () => {
    const before = await getTenant("sao-jose");
    renderPage(<AdminHomePage />, "/sao-jose/admin/site/pagina-inicial", "site/pagina-inicial");
    fireEvent.change(await screen.findByLabelText("URL da imagem principal"), { target: { value: "https://example.com/capa.jpg" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByText("Alterações publicadas", {}, { timeout: 3_000 })).toBeInTheDocument();
    const after = await getTenant("sao-jose");
    expect(after.homeHeader?.imageUrl).toBe("https://example.com/capa.jpg");
    expect(after.telefone).toBe(before.telefone);
    expect(after.confessionSchedule).toEqual(before.confessionSchedule);
    expect(after.name).toBe(before.name);
  });

  it("mostra alça de arrastar e ações nos destaques", async () => {
    const highlights = renderPage(<AdminHighlightsPage />, "/sao-jose/admin/site/destaques", "site/destaques");
    expect(await screen.findByRole("button", { name: /Arrastar destaque Festa do Padroeiro para reordenar/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar destaque Festa do Padroeiro" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mais ações: Festa do Padroeiro" }));
    expect(screen.getByRole("menuitem", { name: "Excluir destaque Festa do Padroeiro" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Mover para cima" })).toBeDisabled();
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    highlights.unmount();
  });

  it("valida o destino do canal e mantém as escolhas locais na prévia", async () => {
    renderPage(<AdminChannelsPage />, "/sao-jose/admin/site/canais", "site/canais");
    fireEvent.click((await screen.findAllByRole("button", { name: "Novo canal" }))[0]);
    fireEvent.change(screen.getByLabelText("Nome do canal"), { target: { value: "Canal inválido" } });
    fireEvent.change(screen.getByLabelText("Destino"), { target: { value: "javascript:alert(1)" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar canal" }));
    expect(screen.getByText("Informe um site, e-mail ou telefone válido.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Destino"), { target: { value: "https://exemplo.org/canal" } });
    fireEvent.click(screen.getByText("Personalizar aparência"));
    fireEvent.click(screen.getByRole("button", { name: "Preenchido" }));
    const preview = screen.getByRole("complementary", { name: "Prévia do canal" });
    expect(within(preview).getByText("Canal inválido")).toBeInTheDocument();
    expect(within(preview).getByText("exemplo.org")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preenchido" })).toHaveAttribute("aria-pressed", "true");
  });

  it("oferece criação no estado vazio e mantém o rascunho quando o servidor falha", async () => {
    server.use(
      http.get(`${baseUrl}/api/v1/admin/tenants/:tenantSlug/links`, () => HttpResponse.json([])),
      http.post(`${baseUrl}/api/v1/admin/tenants/:tenantSlug/links`, () => HttpResponse.json({ code: "ERROR" }, { status: 500 })),
    );
    renderPage(<AdminChannelsPage />, "/sao-jose/admin/site/canais", "site/canais");
    expect(await screen.findByText("Nenhum canal cadastrado")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Novo canal" }));
    const dialog = screen.getByRole("dialog", { name: "Novo canal" });
    fireEvent.change(within(dialog).getByLabelText("Nome do canal"), { target: { value: "Contato" } });
    fireEvent.change(within(dialog).getByLabelText("Destino"), { target: { value: "mailto:secretaria@example.org" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Criar canal" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Não foi possível concluir a alteração");
    expect(within(dialog).getByLabelText("Nome do canal")).toHaveValue("Contato");
    expect(within(dialog).getByRole("button", { name: "Criar canal" })).toBeEnabled();
  });

  it("carrega identidade e horários existentes para edição", async () => {
    const parish = renderPage(<AdminParishPage />, "/sao-jose/admin/paroquia/dados", "paroquia/dados");
    expect(await screen.findByLabelText("Nome oficial")).toHaveValue("Paróquia Santo Antônio de Pádua");
    expect(screen.getByRole("button", { name: /Salvar alterações/ })).toBeInTheDocument();
    parish.unmount();

    renderPage(<AdminSchedulesPage />, "/sao-jose/admin/calendario/confissoes", "calendario/confissoes");
    expect(await screen.findByDisplayValue("Quarta a Sexta")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    await waitFor(() => expect(screen.getAllByLabelText("Dias ou período")).toHaveLength(3));
  });

  it("valida telefone e horários nos respectivos editores", async () => {
    const parish = renderPage(<AdminParishPage />, "/nossa-senhora/admin/paroquia/dados", "paroquia/dados");
    fireEvent.change(await screen.findByLabelText("Telefone ou WhatsApp"), { target: { value: "119" } });
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeDisabled();
    expect(screen.getByText("Informe um telefone com DDD válido.")).toBeInTheDocument();
    parish.unmount();
    renderPage(<AdminSchedulesPage />, "/nossa-senhora/admin/calendario/confissoes", "calendario/confissoes");
    fireEvent.click(await screen.findByRole("button", { name: "Adicionar" }));
    expect(screen.getByText("Informe os dias ou o período.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar horários" })).toBeDisabled();
  });

  it("impede salvar um e-mail inválido na paróquia", async () => {
    renderPage(<AdminParishPage />, "/sao-jose/admin/paroquia/dados", "paroquia/dados");
    const email = await screen.findByLabelText("E-mail");
    fireEvent.change(email, { target: { value: "contato-invalido" } });
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Informe um e-mail válido.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeDisabled();
  });

  it("mantém alterações de contato quando falha e permite tentar novamente", async () => {
    server.use(http.put(baseUrl + "/api/v1/admin/tenants/:tenantSlug", () => HttpResponse.json({ message: "Erro temporário" }, { status: 500 })));
    renderPage(<AdminParishPage />, "/sao-jose/admin/paroquia/dados", "paroquia/dados");
    const phone = await screen.findByLabelText("Telefone ou WhatsApp");
    fireEvent.change(phone, { target: { value: "11977776666" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Suas alterações foram mantidas");
    expect(phone).toHaveValue("(11) 97777-6666");
    server.resetHandlers();
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByText("Alterações publicadas", {}, { timeout: 3_000 })).toBeInTheDocument();
    expect((await getTenant("sao-jose")).telefone).toBe("(11) 97777-6666");
  });

  it("abre cadastro de igreja pelo atalho sem outra seleção", async () => {
    renderPage(<AdminChurchesPage />, "/sao-jose/admin/paroquia/igrejas?action=new", "paroquia/igrejas");
    expect(await screen.findByRole("dialog", { name: "Nova igreja" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Nome")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
    fireEvent.click(screen.getByText("Informar coordenadas manualmente"));
    fireEvent.change(screen.getByLabelText("Latitude"), { target: { value: "-23.55" } });
    fireEvent.change(screen.getByLabelText("Longitude"), { target: { value: "-46.63" } });
    expect(screen.getByRole("button", { name: "Continuar" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByLabelText("Nome")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Cadastrar igreja" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Capela do bairro" } });
    expect(screen.getByRole("button", { name: "Cadastrar igreja" })).toBeEnabled();
  });

  it("busca a localização da igreja e marca o resultado escolhido", async () => {
    let searched: URL | undefined;
    server.use(http.get("https://nominatim.openstreetmap.org/search", ({ request }) => {
      searched = new URL(request.url);
      return HttpResponse.json([{ place_id: 42, lat: "-22.9056", lon: "-47.0608", name: "Catedral Metropolitana", display_name: "Catedral Metropolitana, Campinas, SP, Brasil", address: { road: "Praça José Bonifácio", house_number: "100", suburb: "Centro", city: "Campinas", "ISO3166-2-lvl4": "BR-SP" } }]);
    }));
    renderPage(<AdminChurchesPage />, "/sao-jose/admin/paroquia/igrejas?action=new", "paroquia/igrejas");
    const search = await screen.findByLabelText("Buscar localização");
    expect(screen.getByText(/Nenhum local selecionado/)).toBeInTheDocument();
    fireEvent.change(search, { target: { value: "Catedral Campinas" } });
    fireEvent.keyDown(search, { key: "Enter" });
    expect(screen.getByRole("dialog", { name: "Nova igreja" })).toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: /Catedral Metropolitana/ }, { timeout: 3_000 }));
    expect(searched?.searchParams.get("q")).toBe("Catedral Campinas");
    expect(searched?.searchParams.get("countrycodes")).toBe("br");
    const map = screen.getByRole("dialog", { name: "Marcar local da igreja" });
    expect(within(map).getByLabelText("Buscar localização")).toHaveValue("Catedral Campinas");
    expect(within(map).getByText("Praça José Bonifácio, 100 - Centro, Campinas - SP")).toBeInTheDocument();
    fireEvent.click(within(map).getByRole("button", { name: "Voltar ao formulário sem alterar" }));
    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Retomar marcação no mapa" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar local" }));
    expect(screen.getByText("Local marcado no mapa")).toBeInTheDocument();
    expect(screen.getByLabelText("Endereço exibido no site")).toHaveValue("Praça José Bonifácio, 100 - Centro, Campinas - SP");
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Catedral" } });
    expect(screen.getByRole("button", { name: "Cadastrar igreja" })).toBeEnabled();
  });

  it("marca o local no mapa ampliado e volta ao formulário com o ponto confirmado", async () => {
    server.use(http.get("https://nominatim.openstreetmap.org/search", () =>
      HttpResponse.json([{ place_id: 7, lat: "-22.9", lon: "-47.06", name: "Capela do Bairro", display_name: "Capela do Bairro, Campinas", address: { road: "Rua das Flores", house_number: "10", city: "Campinas", "ISO3166-2-lvl4": "BR-SP" } }])));
    renderPage(<AdminChurchesPage />, "/sao-jose/admin/paroquia/igrejas?action=new", "paroquia/igrejas");
    const open = await screen.findByRole("button", { name: "Marcar no mapa" });
    fireEvent.click(open);
    const expanded = screen.getByRole("dialog", { name: "Marcar local da igreja" });
    expect(within(expanded).getByRole("button", { name: "Voltar ao formulário sem alterar" })).toHaveFocus();
    const search = within(expanded).getByLabelText("Buscar localização");
    fireEvent.change(search, { target: { value: "Capela do Bairro" } });
    fireEvent.keyDown(search, { key: "Enter" });
    fireEvent.click(await within(expanded).findByRole("button", { name: /Capela do Bairro/ }, { timeout: 3_000 }));
    expect(within(expanded).getByText("Rua das Flores, 10, Campinas - SP")).toBeInTheDocument();
    fireEvent.click(within(expanded).getByRole("button", { name: "Confirmar local" }));

    expect(screen.queryByRole("dialog", { name: "Marcar local da igreja" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Nova igreja" })).toBeInTheDocument();
    expect(screen.getByText("Local marcado no mapa")).toBeInTheDocument();
    expect(screen.getByLabelText("Endereço exibido no site")).toHaveValue("Rua das Flores, 10, Campinas - SP");
    await waitFor(() => expect(screen.getByRole("button", { name: "Ajustar no mapa" })).toHaveFocus());
  });

  it("cancela o mapa ampliado com Escape sem fechar o formulário", async () => {
    renderPage(<AdminChurchesPage />, "/sao-jose/admin/paroquia/igrejas?action=new", "paroquia/igrejas");
    fireEvent.click(await screen.findByRole("button", { name: "Marcar no mapa" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Marcar local da igreja" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Nova igreja" })).toBeInTheDocument();
    expect(screen.getByText(/Nenhum local selecionado/)).toBeInTheDocument();
  });

  it("explica quando a busca de localização não encontra nada", async () => {
    server.use(http.get("https://nominatim.openstreetmap.org/search", () => HttpResponse.json([])));
    renderPage(<AdminChurchesPage />, "/sao-jose/admin/paroquia/igrejas?action=new", "paroquia/igrejas");
    const search = await screen.findByLabelText("Buscar localização");
    fireEvent.change(search, { target: { value: "lugar inexistente" } });
    fireEvent.click(screen.getByRole("button", { name: "Buscar endereço" }));
    expect(await screen.findByText(/Não encontramos esse endereço/, {}, { timeout: 3_000 })).toBeInTheDocument();
  });

  it("abre publicação de destaque pelo atalho", async () => {
    renderPage(<AdminHighlightsPage />, "/sao-jose/admin/site/destaques?action=new", "site/destaques");
    expect(await screen.findByRole("dialog", { name: "Novo destaque" })).toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toHaveValue("");
  });

  it("valida o destino do destaque antes de publicar e permite corrigir", async () => {
    renderPage(<AdminHighlightsPage />, "/sao-jose/admin/site/destaques", "site/destaques");
    fireEvent.click((await screen.findAllByRole("button", { name: "Novo destaque" }))[0]);
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Encontro da comunidade" } });
    const destination = screen.getByLabelText(/Para onde o destaque leva/);
    fireEvent.change(destination, { target: { value: "javascript:alert(1)" } });
    expect(destination).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Use um endereço que comece com https:// ou http://.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Publicar" }));
    expect(screen.getByRole("dialog", { name: "Novo destaque" })).toBeInTheDocument();
    fireEvent.change(destination, { target: { value: "https://example.com/encontro" } });
    fireEvent.click(screen.getByRole("button", { name: "Publicar" }));
    expect(await screen.findByText("Destaque publicado")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Novo destaque" })).not.toBeInTheDocument();
  });

  it("orienta a edição do destaque e oferece acesso rápido à prévia no celular", async () => {
    const previousDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scrollIntoView });
    try {
      renderPage(<AdminHighlightsPage />, "/sao-jose/admin/site/destaques", "site/destaques");
      fireEvent.click(await screen.findByRole("button", { name: "Editar destaque Festa do Padroeiro" }));
      expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeDisabled();
      expect(screen.getByText("Faça uma alteração para habilitar o salvamento.")).toBeInTheDocument();
      expect(screen.getByText("Cole um link público que comece com http:// ou https:// e abra a imagem sem pedir login. Sem imagem, será usada a cor escolhida.")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Azul" }));
      expect(screen.getByRole("button", { name: "Azul" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeEnabled();
      expect(screen.queryByText("Faça uma alteração para habilitar o salvamento.")).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Ver prévia" }));
      expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" });
    } finally {
      if (previousDescriptor) Object.defineProperty(HTMLElement.prototype, "scrollIntoView", previousDescriptor);
      else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
    }
  });

});

function renderPage(element: React.ReactNode, path: string, route: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={[path]}><Routes><Route path={`/:tenantSlug/admin/${route}`} element={element} /></Routes></MemoryRouter></QueryClientProvider>);
}
