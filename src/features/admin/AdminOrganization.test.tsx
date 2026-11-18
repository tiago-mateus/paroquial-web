import { AdminLegacyRedirect, AdminSitePage } from "./AdminTaskHubs";
import { AdminSectionTabs } from './AdminSectionTabs';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { setupServer } from "msw/node";
import { createMemoryRouter, RouterProvider, MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { handlers } from "../../mocks/handlers";
import { AdminHomePage } from "./AdminContentPage";
import { AdminLayout } from "./AdminLayout";

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

describe("admin organization", () => {
  it('opens Site in highlights with its tab selected', async () => {
    render(<MemoryRouter initialEntries={['/sao-jose/admin/site']}><Routes>
      <Route path="/:tenantSlug/admin/site" element={<AdminSitePage />} />
      <Route path="/:tenantSlug/admin/site/destaques" element={<AdminSectionTabs />} />
    </Routes></MemoryRouter>);
    expect(await screen.findByRole('link', { name: 'Destaques', current: 'page' })).toHaveAttribute('href', '/sao-jose/admin/site/destaques');
  });

  it("keeps parish navigation active while managing churches", () => {
    render(<MemoryRouter initialEntries={["/sao-jose/admin/paroquia/igrejas"]}><Routes><Route path="/:tenantSlug/admin/*" element={<AdminLayout />} /></Routes></MemoryRouter>);
    expect(screen.queryByRole("link", { name: "Mais" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Paróquia/ }).some(link => link.getAttribute("aria-current") === "page")).toBe(true);
  });

  it("edits only the cover and links to the owners of contact and schedules", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter initialEntries={["/sao-jose/admin/site/pagina-inicial"]}><Routes><Route path="/:tenantSlug/admin/site/pagina-inicial" element={<AdminHomePage />} /></Routes></MemoryRouter></QueryClientProvider>);
    await screen.findByLabelText("URL da imagem principal");
    expect(screen.queryByLabelText("Número do WhatsApp")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Dias ou período")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Contato da secretaria/ })).toHaveAttribute("href", "/sao-jose/admin/paroquia/dados");
    expect(screen.getByRole("link", { name: /Horários de confissão/ })).toHaveAttribute("href", "/sao-jose/admin/calendario/confissoes");
  });
  it("allows staying with unsaved cover changes or explicitly discarding", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const router = createMemoryRouter([
      { path: "/:tenantSlug/admin/site/pagina-inicial", element: <AdminHomePage /> },
      { path: "/:tenantSlug/admin/site", element: <p>Site tasks</p> },
    ], { initialEntries: ["/sao-jose/admin/site/pagina-inicial"] });
    render(<QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider>);
    const field = await screen.findByLabelText("URL da imagem principal");
    fireEvent.change(field, { target: { value: "https://example.com/unsaved.jpg" } });
    fireEvent.click(screen.getByRole("link", { name: "Voltar para Site público" }));
    expect(await screen.findByRole("alertdialog", { name: "Descartar alterações?" })).toBeInTheDocument();
    const stay = screen.getByRole("button", { name: "Continuar editando" });
    expect(stay).toHaveFocus();
    fireEvent.click(stay);
    expect(field).toHaveValue("https://example.com/unsaved.jpg");
    fireEvent.click(screen.getByRole("link", { name: "Voltar para Site público" }));
    fireEvent.click(await screen.findByRole("button", { name: "Descartar e sair" }));
    expect(await screen.findByText("Site tasks")).toBeInTheDocument();
  });

  it("preserves creation parameters when opening a legacy church URL", async () => {
    render(<MemoryRouter initialEntries={["/sao-jose/admin/igrejas?action=new"]}><Routes>
      <Route path="/:tenantSlug/admin/igrejas" element={<AdminLegacyRedirect path="paroquia/igrejas" />} />
      <Route path="/:tenantSlug/admin/paroquia/igrejas" element={<Destination />} />
    </Routes></MemoryRouter>);
    expect(await screen.findByText("/sao-jose/admin/paroquia/igrejas?action=new")).toBeInTheDocument();
  });

});

function Destination() { const location = useLocation(); return <p>{location.pathname + location.search}</p>; }
