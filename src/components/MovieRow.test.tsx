import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeMovie } from "@/test/fixtures/movies";
import { MovieRow } from "./MovieRow";

describe("MovieRow", () => {
  it("mostra o título, o link para ver todos e um card por filme", () => {
    render(
      <MovieRow
        title="Ficção científica"
        href="/explorar?genero=878"
        movies={[makeMovie({ id: 1, title: "A" }), makeMovie({ id: 2, title: "B" })]}
      />,
    );
    const region = screen.getByRole("region", { name: "Ficção científica" });
    expect(within(region).getByRole("link", { name: "Ver todos de Ficção científica" })).toHaveAttribute("href", "/explorar?genero=878");
    expect(within(region).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["A", "B"]);
  });

  it("sem filmes não renderiza nada", () => {
    const { container } = render(<MovieRow title="Terror" href="/explorar?genero=27" movies={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
