import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AdminCalendarHeader } from "../calendar/admin/components/AdminCalendarHeader";
import { AdminPageHeader } from "./AdminPageHeader";

describe("shared admin header", () => {
  it("renders one page heading and the contextual navigation", () => {
    render(<MemoryRouter initialEntries={["/sao-jose/admin/site/canais"]}><Routes>
      <Route path="/:tenantSlug/admin">
        <Route path="site/canais" element={<AdminPageHeader showBack title="Canais oficiais" publicHref="/sao-jose/links" />} />
      </Route>
    </Routes></MemoryRouter>);
    expect(document.querySelectorAll("header")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const header = document.querySelector("header")!;
    expect(within(header).getByRole("link", { name: "Voltar para Site público" })).toHaveAttribute("href", "/sao-jose/admin/site");
    expect(within(header).getByRole("link", { name: "Ver site público" })).toHaveAttribute("href", "/sao-jose/links");
  });

  it("uses the same header for Agenda while preserving its actions", () => {
    const onCreate = vi.fn();
    render(<MemoryRouter initialEntries={["/sao-jose/admin/calendario"]}><Routes>
      <Route path="/:tenantSlug/admin">
        <Route path="calendario" element={<AdminCalendarHeader publicHref="/sao-jose/calendario?date=2026-09-14" onCreate={onCreate} />} />
      </Route>
    </Routes></MemoryRouter>);
    expect(document.querySelectorAll("header")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1, name: "Agenda" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Novo evento" }));
    expect(onCreate).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Ver agenda pública" })).toHaveAttribute("href", "/sao-jose/calendario?date=2026-09-14");
  });
});
