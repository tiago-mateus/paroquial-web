import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequireAdmin } from "./RequireAdmin";
import { getSession } from "./auth.api";

vi.mock("./auth.api", () => ({ getSession: vi.fn() }));
const session = { user: { id: "1", name: "Teste", email: "teste@example.test" }, adminTenants: [{ id: "tenant-1", slug: "sao-jose", name: "São José", role: "owner" }] };
beforeEach(() => vi.clearAllMocks());
function setup(client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={["/sao-jose/admin"]}><Routes>
    <Route path="/:tenantSlug/admin" element={<RequireAdmin><h1>Conteúdo administrativo</h1></RequireAdmin>} />
    <Route path="/login" element={<h1>Entrar</h1>} /><Route path="/assinar" element={<h1>Continuar contratação</h1>} />
  </Routes></MemoryRouter></QueryClientProvider>);
}
describe("Acesso ao administrativo", () => {
  it("encaminha a contratação incompleta e não renderiza o admin", async () => {
    vi.mocked(getSession).mockResolvedValue({ ...session, adminTenants: [], onboardingRequired: true });
    setup();
    expect(await screen.findByRole("heading", { name: "Continuar contratação" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Conteúdo administrativo" })).not.toBeInTheDocument();
  });
  it("exige sessão e vínculo com a paróquia solicitada", async () => {
    vi.mocked(getSession).mockResolvedValue({ ...session, adminTenants: [] });
    setup();
    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeInTheDocument();
  });
  it("redireciona sessão expirada para o login", async () => {
    vi.mocked(getSession).mockRejectedValue({ code: "UNAUTHORIZED" });
    setup();
    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeInTheDocument();
  });
  it("não mostra permissões antigas enquanto revalida a sessão", async () => {
    vi.mocked(getSession).mockImplementation(() => new Promise(() => {}));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(["session"], session);
    setup(client);
    expect(await screen.findByRole("status")).toHaveTextContent("Verificando seu acesso");
    expect(screen.queryByRole("heading", { name: "Conteúdo administrativo" })).not.toBeInTheDocument();
  });
});
