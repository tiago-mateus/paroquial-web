import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CoverImage } from "./CoverImage";

describe("CoverImage", () => {
  it("usa a foto alternativa quando a capa não carrega", () => {
    const { container } = render(<CoverImage src="/capa.jpg" fallbackSrc="/igreja.jpg" />);

    fireEvent.error(container.querySelector("img")!);

    expect(container.querySelector("img")).toHaveAttribute("src", "/igreja.jpg");
  });

  it("remove a imagem quebrada quando todas as fontes falham", () => {
    const { container } = render(<CoverImage src="/capa.jpg" fallbackSrc="/igreja.jpg" />);

    fireEvent.error(container.querySelector("img")!);
    fireEvent.error(container.querySelector("img")!);

    expect(container.querySelector("img")).toBeNull();
  });

  it("carrega uma nova capa após a anterior falhar", () => {
    const { container, rerender } = render(<CoverImage src="/indisponivel.jpg" />);
    fireEvent.error(container.querySelector("img")!);

    rerender(<CoverImage src="/nova-capa.jpg" />);

    expect(container.querySelector("img")).toHaveAttribute("src", "/nova-capa.jpg");
  });
});
