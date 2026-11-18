import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  AdminFormSection,
  AdminPage,
  AdminPageContent,
  AdminSurface,
  AdminSurfaceHeader,
} from "./AdminPage";

describe("admin page foundations", () => {
  it("composes one administrative page with the standard content width", () => {
    render(
      <AdminPage header={<header>Topo</header>}>
        <AdminPageContent>
          <p>Conteúdo</p>
        </AdminPageContent>
      </AdminPage>,
    );

    expect(screen.getByTestId("admin-page")).toContainElement(screen.getByText("Topo"));
    expect(screen.getByTestId("admin-page-content")).toHaveAttribute("data-width", "standard");
    expect(screen.getByText("Conteúdo")).toBeInTheDocument();
  });

  it("supports the wide content variant used by agenda and churches", () => {
    render(<AdminPageContent width="wide">Mapa</AdminPageContent>);

    expect(screen.getByTestId("admin-page-content")).toHaveAttribute("data-width", "wide");
  });

  it("associates a surface with its heading, summary and action", () => {
    render(
      <AdminSurface labelledBy="channels-title">
        <AdminSurfaceHeader
          id="channels-title"
          title="Canais cadastrados"
          description="Ordem exibida no site"
          summary="3 publicados"
          action={<button type="button">Novo canal</button>}
        />
        <p>Lista</p>
      </AdminSurface>,
    );

    const surface = screen.getByRole("region", { name: "Canais cadastrados" });
    expect(surface).toHaveTextContent("Ordem exibida no site");
    expect(surface).toHaveTextContent("3 publicados");
    expect(screen.getByRole("button", { name: "Novo canal" })).toBeInTheDocument();
  });

  it("uses second-level headings for form sections", () => {
    render(
      <AdminFormSection title="Dados institucionais" description="Informações públicas">
        <label>
          Nome
          <input />
        </label>
      </AdminFormSection>,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Dados institucionais" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
  });
});
