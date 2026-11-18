import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { handlers } from "../../mocks/handlers";
import { baseUrl } from "../../mocks/utils";
import type { UpsertChurchRequest } from "../../shared/api/churches";
import type { AdminChurchesMapProps } from "./AdminChurchesMap";
import { AdminChurchesPage } from "./AdminChurchesPage";

vi.mock("./AdminChurchesMap", () => ({
  AdminChurchesMap: ({ churches, picking, onPick, onSelect }: AdminChurchesMapProps) => <div aria-label="Mapa de igrejas">
    <button type="button" disabled={!picking} onClick={() => onPick({ latitude: -23.56, longitude: -46.64 })}>Escolher ponto no mapa</button>
    {churches[0] ? <button type="button" onClick={() => onSelect(churches[0])}>Selecionar marcador</button> : null}
  </div>,
}));

const server = setupServer(http.get("https://nominatim.openstreetmap.org/reverse", () => HttpResponse.json({ error: "Endereço não encontrado" })), ...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={["/sao-jose/admin/paroquia/igrejas"]}><Routes><Route path="/:tenantSlug/admin/paroquia/igrejas" element={<AdminChurchesPage />} /></Routes></MemoryRouter></QueryClientProvider>);
}

describe("cadastro de igrejas pelo mapa", () => {
  it("envia a localização escolhida no mapa com os dados do formulário", async () => {
    let submitted: UpsertChurchRequest | undefined;
    server.use(http.post(`${baseUrl}/api/v1/admin/tenants/:tenantSlug/churches`, async ({ request }) => {
      submitted = await request.json() as UpsertChurchRequest;
      return HttpResponse.json({ ...submitted, id: "new-church", tenantId: "sao-jose" });
    }));
    renderPage();
    await waitFor(() => expect(screen.getByRole("button", { name: "Cadastrar no mapa" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar no mapa" }));
    fireEvent.click(screen.getByRole("button", { name: "Escolher ponto no mapa" }));
    expect(screen.getByRole("dialog", { name: "Nova igreja" })).toBeInTheDocument();
    expect(screen.getByLabelText("Latitude")).toHaveValue(-23.56);
    expect(screen.getByLabelText("Longitude")).toHaveValue(-46.64);
    expect(screen.getByLabelText("Nome")).toHaveFocus();
    expect(screen.getByRole("button", { name: "Cadastrar igreja" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Capela do mapa" } });
    fireEvent.click(screen.getByRole("radio", { name: "Comunidade" }));
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar igreja" }));
    await waitFor(() => expect(submitted).toMatchObject({ nome: "Capela do mapa", tipo: "comunidade", latitude: -23.56, longitude: -46.64 }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Nova igreja" })).not.toBeInTheDocument());
  });

  it("cancela a marcação com Escape e restaura o foco", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole("button", { name: "Cadastrar no mapa" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar no mapa" }));
    expect(screen.getByRole("button", { name: "Cancelar marcação no mapa" })).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Marque no mapa onde fica a nova igreja.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cadastrar no mapa" })).toHaveFocus();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("abre a edição da igreja selecionada no mapa", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Selecionar marcador" }));
    expect(screen.getByRole("dialog", { name: "Editar igreja" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).not.toHaveValue("");
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeDisabled();
  });

  it("permite escolher a primeira localização sem igrejas cadastradas", async () => {
    server.use(http.get(`${baseUrl}/api/v1/tenants/:tenantSlug/churches`, () => HttpResponse.json([])));
    renderPage();
    expect(await screen.findByText("Nenhum local cadastrado")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar no mapa" }));
    fireEvent.click(screen.getByRole("button", { name: "Escolher ponto no mapa" }));
    expect(screen.getByRole("dialog", { name: "Nova igreja" })).toBeInTheDocument();
    expect(screen.getByLabelText("Latitude")).toHaveValue(-23.56);
  });

  it("preserva os dados ao voltar para alterar a localização", async () => {
    await startFromMap();
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Capela São Lucas" } });
    fireEvent.change(screen.getByLabelText("Endereço exibido no site"), { target: { value: "Rua do bairro, 15" } });
    fireEvent.click(screen.getByRole("radio", { name: "Matriz" }));
    fireEvent.click(screen.getByRole("button", { name: "Alterar localização" }));
    expect(screen.getByRole("button", { name: "Continuar" })).toBeEnabled();
    expect(screen.getByRole("searchbox", { name: "Buscar localização" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByLabelText("Nome")).toHaveValue("Capela São Lucas");
    expect(screen.getByLabelText("Endereço exibido no site")).toHaveValue("Rua do bairro, 15");
    expect(screen.getByRole("radio", { name: "Matriz" })).toBeChecked();
  });

  it("sugere o endereço do ponto sem sobrescrever um endereço digitado", async () => {
    let release: () => void = () => {};
    const responseReady = new Promise<void>((resolve) => { release = resolve; });
    server.use(http.get("https://nominatim.openstreetmap.org/reverse", async () => {
      await responseReady;
      return HttpResponse.json({ place_id: 1, lat: "-23.56", lon: "-46.64", display_name: "Rua sugerida, 10", address: { road: "Rua sugerida", house_number: "10" } });
    }));
    await startFromMap();
    fireEvent.change(screen.getByLabelText("Endereço exibido no site"), { target: { value: "Endereço conferido pela secretaria" } });
    release();
    await waitFor(() => expect(screen.queryByText(/Buscando o endereço deste ponto/)).not.toBeInTheDocument(), { timeout: 3000 });
    expect(screen.getByLabelText("Endereço exibido no site")).toHaveValue("Endereço conferido pela secretaria");
  });

  it("preenche o endereço quando a consulta do ponto responde", async () => {
    server.use(http.get("https://nominatim.openstreetmap.org/reverse", () => HttpResponse.json({ place_id: 1, lat: "-23.56", lon: "-46.64", display_name: "Rua da Paz, 10", address: { road: "Rua da Paz", house_number: "10" } })));
    await startFromMap();
    expect(await screen.findByDisplayValue("Rua da Paz, 10", {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it("avisa sobre nome repetido e permite corrigir um link de foto inválido", async () => {
    await startFromMap();
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Igreja Matriz São José" } });
    expect(screen.getByText(/Já existe um local chamado/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Foto e contato"));
    fireEvent.change(screen.getByLabelText("URL da imagem"), { target: { value: "javascript:alert(1)" } });
    expect(screen.getByLabelText("URL da imagem")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("button", { name: "Cadastrar igreja" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("URL da imagem"), { target: { value: "https://example.com/igreja.jpg" } });
    expect(screen.getByRole("button", { name: "Cadastrar igreja" })).toBeEnabled();
  });

  it("mantém os dados se o salvamento falhar e permite tentar novamente", async () => {
    let attempts = 0;
    server.use(http.post(`${baseUrl}/api/v1/admin/tenants/:tenantSlug/churches`, async ({ request }) => {
      attempts += 1;
      if (attempts === 1) return HttpResponse.json({ message: "Falha temporária" }, { status: 500 });
      return HttpResponse.json({ ...await request.json() as UpsertChurchRequest, id: "saved-after-retry", tenantId: "sao-jose" });
    }));
    await startFromMap();
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Capela preservada" } });
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar igreja" }));
    expect(await screen.findByText(/Não foi possível salvar/)).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("Capela preservada");
    expect(screen.getByLabelText("Latitude")).toHaveValue(-23.56);
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar igreja" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Nova igreja" })).not.toBeInTheDocument());
    expect(attempts).toBe(2);
  });

  it("abre a igreja existente ao clicar em seu marcador durante um cadastro", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole("button", { name: "Cadastrar no mapa" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar no mapa" }));
    fireEvent.click(screen.getByRole("button", { name: "Selecionar marcador" }));
    expect(screen.getByRole("dialog", { name: "Editar igreja" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Nova igreja" })).not.toBeInTheDocument();
  });

  it("impede salvar se as coordenadas forem alteradas para um ponto inválido", async () => {
    await startFromMap();
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Capela com localização a revisar" } });
    fireEvent.click(screen.getByText("Informar coordenadas manualmente"));
    fireEvent.change(screen.getByLabelText("Latitude"), { target: { value: "99" } });
    expect(screen.getByText("Revise a localização")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cadastrar igreja" })).toBeDisabled();
  });
});

async function startFromMap() {
  renderPage();
  await waitFor(() => expect(screen.getByRole("button", { name: "Cadastrar no mapa" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Cadastrar no mapa" }));
  fireEvent.click(screen.getByRole("button", { name: "Escolher ponto no mapa" }));
}
