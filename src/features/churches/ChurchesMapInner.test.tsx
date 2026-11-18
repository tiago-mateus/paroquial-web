import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { churches } from "../../mocks/data/churches";
import ChurchesMapInner from "./ChurchesMapInner";

// Keep the real Leaflet lifecycle; WebGL rendering is unrelated to teardown.
vi.mock("./ChurchLightMapLayer", () => ({ ChurchLightMapLayer: () => null }));

describe("ChurchesMapInner", () => {
  it("permite sair do mapa com uma igreja selecionada e animação ativa", async () => {
    const { container, unmount } = render(
      <ChurchesMapInner
        churches={churches.filter((church) => church.tenantSlug === "sao-jose")}
        selectedId="church-sj-fatima"
        focusSelection
        onSelect={vi.fn()}
        onSelectGroup={vi.fn()}
      />,
    );

    await waitFor(() => expect(container.querySelector(".leaflet-map-pane")).not.toBeNull());

    expect(() => unmount()).not.toThrow();
    expect(container.querySelector(".leaflet-container")).toBeNull();
  });
});
