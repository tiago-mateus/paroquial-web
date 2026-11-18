import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomeHighlights } from "./HomeHighlights";

const banners = [
  { id: "feast", titulo: "Festa do Padroeiro" },
  { id: "campaign", titulo: "Campanha do Agasalho" },
];

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function renderHighlights() {
  return render(<HomeHighlights banners={banners} includeLiturgy reading={{ referencia: "Mt 10,16-23", liturgia: "São Bento, abade" }} />);
}

function expectActive(index: number, title: string) {
  expect(screen.getByRole("button", { name: `Exibir destaque ${index}: ${title}` })).toHaveAttribute("aria-current", "true");
}

describe("HomeHighlights", () => {
  it("começa pelo Evangelho, avança automaticamente e volta ao primeiro item", () => {
    renderHighlights();
    expect(screen.getAllByRole("group", { name: /de 3:/ })[0]).toHaveAccessibleName("1 de 3: Evangelho do Dia");
    expectActive(1, "Evangelho do Dia");
    act(() => vi.advanceTimersByTime(6000));
    expectActive(2, "Festa do Padroeiro");
    act(() => vi.advanceTimersByTime(6000));
    expectActive(3, "Campanha do Agasalho");
    act(() => vi.advanceTimersByTime(6000));
    expectActive(1, "Evangelho do Dia");
  });

  it("permite pausar e retomar a rotação", () => {
    renderHighlights();
    fireEvent.click(screen.getByRole("button", { name: "Pausar destaques automáticos" }));
    act(() => vi.advanceTimersByTime(12000));
    expectActive(1, "Evangelho do Dia");
    fireEvent.click(screen.getByRole("button", { name: "Retomar destaques automáticos" }));
    act(() => vi.advanceTimersByTime(6000));
    expectActive(2, "Festa do Padroeiro");
  });

  it("interrompe a rotação ao navegar manualmente ou focar o conteúdo", () => {
    renderHighlights();
    fireEvent.click(screen.getByRole("button", { name: "Exibir próximo destaque" }));
    act(() => vi.advanceTimersByTime(12000));
    expectActive(2, "Festa do Padroeiro");
    fireEvent.click(screen.getByRole("button", { name: "Retomar destaques automáticos" }));
    fireEvent.focus(screen.getByRole("link", { name: /Ler evangelho/ }));
    act(() => vi.advanceTimersByTime(12000));
    expectActive(1, "Evangelho do Dia");
    expect(screen.getByRole("button", { name: "Retomar destaques automáticos" })).toBeInTheDocument();
  });

  it("respeita movimento reduzido e páginas em segundo plano", () => {
    const matchMedia = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({ ...matchMedia(query), matches: query.includes("prefers-reduced-motion") }));
    renderHighlights();
    act(() => vi.advanceTimersByTime(12000));
    expectActive(1, "Evangelho do Dia");
    vi.mocked(window.matchMedia).mockImplementation(matchMedia);
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    act(() => vi.advanceTimersByTime(12000));
    expectActive(1, "Evangelho do Dia");
  });

  it("mantém o Evangelho sem controles quando não há avisos", () => {
    render(<HomeHighlights banners={[]} includeLiturgy readingStatus="error" />);
    expect(screen.getByRole("heading", { name: "Evangelho do Dia" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("A leitura de hoje está indisponível.");
    expect(screen.queryByRole("button", { name: /destaques automáticos/ })).not.toBeInTheDocument();
  });
});
